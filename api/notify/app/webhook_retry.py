"""Webhook retry logic with exponential backoff for Notify Service."""
import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import redis.asyncio as redis

from shared.logging import get_logger
from shared.redis import get_redis_pool

logger = get_logger("webhook_retry")

MAX_RETRIES = 5
BASE_DELAY_SECONDS = 5
QUEUE_KEY = "webhook:retry:queue"


class WebhookDelivery:
    """Represents a webhook delivery attempt."""
    
    def __init__(
        self,
        url: str,
        payload: dict,
        attempt: int = 0,
        max_retries: int = MAX_RETRIES,
        delivery_id: Optional[str] = None,
    ):
        self.delivery_id = delivery_id or str(uuid.uuid4())
        self.url = url
        self.payload = payload
        self.attempt = attempt
        self.max_retries = max_retries
        self.created_at = datetime.now(timezone.utc)
    
    def to_dict(self) -> dict:
        return {
            "delivery_id": self.delivery_id,
            "url": self.url,
            "payload": self.payload,
            "attempt": self.attempt,
            "max_retries": self.max_retries,
            "created_at": self.created_at.isoformat(),
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "WebhookDelivery":
        delivery = cls(
            url=data["url"],
            payload=data["payload"],
            attempt=data["attempt"],
            max_retries=data["max_retries"],
            delivery_id=data["delivery_id"],
        )
        delivery.created_at = datetime.fromisoformat(data["created_at"])
        return delivery
    
    def get_delay(self) -> float:
        """Calculate exponential backoff delay."""
        return BASE_DELAY_SECONDS * (2 ** self.attempt)
    
    def should_retry(self) -> bool:
        """Check if delivery should be retried."""
        return self.attempt < self.max_retries


async def send_webhook_with_retry(
    redis_client: redis.Redis,
    url: str,
    payload: dict,
) -> bool:
    """Send webhook immediately, queue for retry if it fails."""
    success = await _send_webhook(url, payload)
    
    if not success:
        delivery = WebhookDelivery(url=url, payload=payload)
        await _queue_for_retry(redis_client, delivery)
        logger.info("webhook_queued_for_retry", delivery_id=delivery.delivery_id, url=url)
    
    return success


async def _send_webhook(url: str, payload: dict) -> bool:
    """Send a single webhook request."""
    logger.info("sending_webhook", url=url)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            success = response.status_code < 400
            if not success:
                logger.warning("webhook_failed", url=url, status_code=response.status_code)
            return success
    except Exception as e:
        logger.error("webhook_send_failed", url=url, error=str(e))
        return False


async def _queue_for_retry(redis_client: redis.Redis, delivery: WebhookDelivery) -> None:
    """Queue a failed webhook for retry with exponential backoff."""
    if not delivery.should_retry():
        logger.warning("webhook_max_retries_exceeded", delivery_id=delivery.delivery_id, url=delivery.url)
        return
    
    # Calculate next attempt time
    delay = delivery.get_delay()
    next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
    
    # Use Redis sorted set with score = next attempt timestamp
    score = next_attempt_at.timestamp()
    delivery_data = json.dumps(delivery.to_dict())
    
    await redis_client.zadd(QUEUE_KEY, {delivery_data: score})
    logger.info("webhook_queued", delivery_id=delivery.delivery_id, attempt=delivery.attempt + 1, delay=delay)


async def process_retry_queue(redis_client: redis.Redis) -> int:
    """Process due webhooks from the retry queue. Returns number processed."""
    now = datetime.now(timezone.utc).timestamp()
    
    # Get all deliveries that are due (score <= now)
    due_items = await redis_client.zrangebyscore(QUEUE_KEY, 0, now)
    
    if not due_items:
        return 0
    
    processed = 0
    for item in due_items:
        try:
            # Remove from queue
            await redis_client.zrem(QUEUE_KEY, item)
            
            data = json.loads(item)
            delivery = WebhookDelivery.from_dict(data)
            
            # Attempt delivery
            success = await _send_webhook(delivery.url, delivery.payload)
            
            if success:
                logger.info("webhook_retry_succeeded", delivery_id=delivery.delivery_id)
                processed += 1
            else:
                # Increment attempt and re-queue
                delivery.attempt += 1
                await _queue_for_retry(redis_client, delivery)
        except Exception as e:
            logger.error("webhook_retry_error", error=str(e))
    
    return processed


async def start_retry_processor(redis_pool: redis.Redis, interval: int = 10) -> None:
    """Background task that continuously processes the retry queue."""
    logger.info("webhook_retry_processor_started", interval=interval)
    
    while True:
        try:
            processed = await process_retry_queue(redis_pool)
            if processed > 0:
                logger.info("webhook_retry_batch_processed", count=processed)
        except Exception as e:
            logger.error("webhook_retry_processor_error", error=str(e))
        
        await asyncio.sleep(interval)
