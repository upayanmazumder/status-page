"""Common Pydantic schemas shared across services."""
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field


class HealthCheck(BaseModel):
    """Health check response schema."""

    status: str
    service: str
    version: str = "1.0.0"
    details: Optional[Dict[str, Any]] = None


class PaginationParams(BaseModel):
    """Pagination query parameters."""

    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    cursor: Optional[str] = None

    @property
    def offset(self) -> int:
        """Calculate SQL offset from page and limit."""
        return (self.page - 1) * self.limit


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        limit: int,
    ) -> "PaginatedResponse[T]":
        pages = (total + limit - 1) // limit
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    status_code: int


class AuditLogEntry(BaseModel):
    """Audit log entry schema."""

    id: str
    org_id: str
    actor_id: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    changes: Optional[Dict[str, Any]]
    meta: Optional[Dict[str, Any]]
    created_at: str
