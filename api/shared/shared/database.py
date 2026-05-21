"""Async database configuration using SQLAlchemy."""
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from shared.config import get_settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class DatabaseManager:
    """Manages async database connections."""

    _instance: Optional["DatabaseManager"] = None
    _engine = None
    _session_factory = None

    def __new__(cls) -> "DatabaseManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        settings = get_settings()
        self._engine = create_async_engine(
            settings.database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_pre_ping=True,
            pool_recycle=settings.database_pool_recycle,
            echo=settings.debug,
        )
        self._session_factory = async_sessionmaker(
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

    @property
    def engine(self):
        return self._engine

    @property
    def session_factory(self):
        return self._session_factory

    async def close(self) -> None:
        """Close database connections."""
        if self._engine:
            await self._engine.dispose()

    async def create_tables(self) -> None:
        """Create all tables (for development only)."""
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def drop_tables(self) -> None:
        """Drop all tables (for testing only)."""
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI to get async database sessions."""
    db = DatabaseManager().session_factory()
    try:
        yield db
    finally:
        await db.close()
