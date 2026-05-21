"""Event publishing and cache invalidation utilities."""
import json
from typing import Any, Dict, Optional

import redis.asyncio as redis

from shared.logging import get_logger

logger = get_logger("events")


class EventPublisher:
    """Publishes events to Redis pub/sub for real-time updates."""

    @staticmethod
    async def publish(
        redis_client: redis.Redis,
        channel: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> None:
        """Publish an event to a Redis channel."""
        event = {
            "type": event_type,
            "payload": payload,
        }
        try:
            await redis_client.publish(channel, json.dumps(event))
            logger.debug("event_published", channel=channel, event_type=event_type)
        except Exception as e:
            logger.error("event_publish_failed", channel=channel, error=str(e))

    @staticmethod
    async def invalidate_status_cache(
        redis_client: redis.Redis,
        org_slug: str,
        project_slug: str = "default",
    ) -> None:
        """Invalidate cached status page data."""
        cache_key = f"status:{org_slug}:{project_slug}"
        try:
            await redis_client.delete(cache_key)
            logger.debug("cache_invalidated", key=cache_key)
        except Exception as e:
            logger.error("cache_invalidation_failed", key=cache_key, error=str(e))

    @staticmethod
    async def invalidate_component_cache(
        redis_client: redis.Redis,
        project_id: str,
    ) -> None:
        """Invalidate component list caches."""
        pattern = f"components:{project_id}:*"
        try:
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
                logger.debug("cache_invalidated", pattern=pattern, count=len(keys))
        except Exception as e:
            logger.error("cache_invalidation_failed", pattern=pattern, error=str(e))

    @staticmethod
    async def publish_component_change(
        redis_client: redis.Redis,
        org_slug: str,
        project_slug: str,
        component_id: str,
        action: str,  # created, updated, deleted
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Publish component change event and invalidate cache."""
        channel = f"events:{org_slug}:{project_slug}"
        await EventPublisher.publish(
            redis_client,
            channel,
            f"component.{action}",
            {"component_id": component_id, "data": data or {}},
        )
        await EventPublisher.invalidate_status_cache(redis_client, org_slug, project_slug)

    @staticmethod
    async def publish_incident_change(
        redis_client: redis.Redis,
        org_slug: str,
        project_slug: str,
        incident_id: str,
        action: str,  # created, updated, resolved
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Publish incident change event and invalidate cache."""
        channel = f"events:{org_slug}:{project_slug}"
        await EventPublisher.publish(
            redis_client,
            channel,
            f"incident.{action}",
            {"incident_id": incident_id, "data": data or {}},
        )
        await EventPublisher.invalidate_status_cache(redis_client, org_slug, project_slug)

    @staticmethod
    async def publish_maintenance_change(
        redis_client: redis.Redis,
        org_slug: str,
        project_slug: str,
        maintenance_id: str,
        action: str,  # scheduled, started, completed, cancelled, updated, deleted
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Publish maintenance change event and invalidate cache."""
        channel = f"events:{org_slug}:{project_slug}"
        payload = {"maintenance_id": maintenance_id}
        if data:
            payload["data"] = data
        await EventPublisher.publish(
            redis_client,
            channel,
            f"maintenance.{action}",
            payload,
        )
        await EventPublisher.invalidate_status_cache(redis_client, org_slug, project_slug)
