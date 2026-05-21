"""Tests for database module."""
import pytest

from shared.database import DatabaseManager, get_async_session, Base


class TestDatabaseManager:
    def test_singleton(self):
        db1 = DatabaseManager()
        db2 = DatabaseManager()
        assert db1 is db2

    def test_engine_exists(self):
        db = DatabaseManager()
        assert db.engine is not None

    def test_session_factory_exists(self):
        db = DatabaseManager()
        assert db.session_factory is not None

    @pytest.mark.asyncio
    async def test_get_async_session(self):
        session_generator = get_async_session()
        session = await session_generator.__anext__()
        assert session is not None
        # Clean up
        try:
            await session_generator.__anext__()
        except StopAsyncIteration:
            pass


class TestBase:
    def test_base_class(self):
        assert Base is not None
