"""Tests for Redis module."""
import pytest

from shared.redis import RedisManager, get_redis


class TestRedisManager:
    def test_singleton(self):
        redis1 = RedisManager()
        redis2 = RedisManager()
        assert redis1 is redis2

    def test_initial_state(self):
        redis_manager = RedisManager()
        assert redis_manager._client is None

    @pytest.mark.asyncio
    async def test_connect(self):
        redis_manager = RedisManager()
        client = await redis_manager.connect()
        assert client is not None

    @pytest.mark.asyncio
    async def test_get_redis(self):
        client = await get_redis()
        assert client is not None

    @pytest.mark.asyncio
    async def test_disconnect(self):
        redis_manager = RedisManager()
        await redis_manager.connect()
        await redis_manager.disconnect()
        assert redis_manager._client is None
