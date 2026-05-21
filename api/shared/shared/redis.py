"""Async Redis client configuration."""
from typing import Optional

import redis.asyncio as redis

from shared.config import get_settings


class RedisManager:
    """Manages async Redis connections."""

    _instance: Optional["RedisManager"] = None
    _client: Optional[redis.Redis] = None

    def __new__(cls) -> "RedisManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def connect(self) -> redis.Redis:
        """Initialize Redis connection."""
        if self._client is None:
            settings = get_settings()
            self._client = redis.from_url(
                settings.redis_url,
                max_connections=settings.redis_pool_size,
                decode_responses=True,
            )
        return self._client

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None

    async def ping(self) -> bool:
        """Check Redis connectivity."""
        client = await self.connect()
        return await client.ping()

    async def get_client(self) -> redis.Redis:
        """Get or create Redis client."""
        return await self.connect()


async def get_redis() -> redis.Redis:
    """Dependency for FastAPI to get Redis client."""
    manager = RedisManager()
    return await manager.get_client()
