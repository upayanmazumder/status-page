"""Bulk operations endpoint for Dashboard Service."""
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared import get_current_user, get_async_session, NotFoundError
from shared.models import Component, ComponentStatus
from shared.logging import get_logger

router = APIRouter(prefix="/bulk", tags=["bulk"])
logger = get_logger("dashboard_bulk")


class BulkStatusUpdate(BaseModel):
    component_ids: List[str]
    status: str


class BulkDelete(BaseModel):
    component_ids: List[str]


class BulkResponse(BaseModel):
    updated: int
    failed: int
    errors: List[str]


@router.post("/components/status")
async def bulk_update_status(
    data: BulkStatusUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Update status for multiple components at once."""
    logger.info("bulk_status_update", count=len(data.component_ids), status=data.status)
    
    updated = 0
    failed = 0
    errors = []
    
    for comp_id in data.component_ids:
        try:
            result = await db.execute(
                select(Component).where(Component.id == comp_id)
            )
            component = result.scalar_one_or_none()
            if component:
                component.status = ComponentStatus(data.status)
                updated += 1
            else:
                failed += 1
                errors.append(f"Component {comp_id} not found")
        except Exception as e:
            failed += 1
            errors.append(f"Failed to update {comp_id}: {str(e)}")
    
    await db.commit()
    return BulkResponse(updated=updated, failed=failed, errors=errors)


@router.post("/components/delete")
async def bulk_delete(
    data: BulkDelete,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Soft delete multiple components."""
    logger.info("bulk_delete", count=len(data.component_ids))
    
    deleted = 0
    failed = 0
    errors = []
    
    for comp_id in data.component_ids:
        try:
            result = await db.execute(
                select(Component).where(Component.id == comp_id)
            )
            component = result.scalar_one_or_none()
            if component:
                from datetime import datetime, timezone
                component.deleted_at = datetime.now(timezone.utc)
                deleted += 1
            else:
                failed += 1
                errors.append(f"Component {comp_id} not found")
        except Exception as e:
            failed += 1
            errors.append(f"Failed to delete {comp_id}: {str(e)}")
    
    await db.commit()
    return BulkResponse(updated=deleted, failed=failed, errors=errors)
