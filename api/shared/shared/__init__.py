"""Shared utilities for Status Page Platform microservices."""

from shared.config import Settings, get_settings
from shared.database import Base, DatabaseManager, get_async_session
from shared.redis import RedisManager, get_redis
from shared.jwt import JWTManager
from shared.logging import configure_logging
from shared.errors import (
    StatusPageError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
)
from shared.schemas import (
    HealthCheck,
    PaginatedResponse,
    PaginationParams,
    ErrorResponse,
)

__all__ = [
    "Settings",
    "get_settings",
    "Base",
    "DatabaseManager",
    "get_async_session",
    "RedisManager",
    "get_redis",
    "JWTManager",
    "configure_logging",
    "StatusPageError",
    "AuthenticationError",
    "AuthorizationError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    "RateLimitError",
    "HealthCheck",
    "PaginatedResponse",
    "PaginationParams",
    "ErrorResponse",
]
