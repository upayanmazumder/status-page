"""Custom exceptions and FastAPI error handlers."""
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from shared.schemas import ErrorResponse


class StatusPageError(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(StatusPageError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(StatusPageError):
    """Raised when user lacks permissions."""

    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class ValidationError(StatusPageError):
    """Raised when request validation fails."""

    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class NotFoundError(StatusPageError):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ConflictError(StatusPageError):
    """Raised when a resource conflict occurs."""

    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_409_CONFLICT, details)


class RateLimitError(StatusPageError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


def setup_error_handlers(app: FastAPI) -> None:
    """Register error handlers with a FastAPI application."""

    @app.exception_handler(StatusPageError)
    async def handle_statuspage_error(request: Request, exc: StatusPageError):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=exc.__class__.__name__,
                message=exc.message,
                details=exc.details,
                status_code=exc.status_code,
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def handle_generic_error(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="InternalServerError",
                message="An unexpected error occurred",
                details={"type": exc.__class__.__name__},
                status_code=500,
            ).model_dump(),
        )
