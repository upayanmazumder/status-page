"""Maintenance endpoints for Dashboard Service."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from shared import get_current_user, get_async_session, get_redis, NotFoundError
from shared.models import AuditLog, Component, Maintenance, MaintenanceStatus, Project
from shared.events import EventPublisher
from shared.logging import get_logger
from shared.schemas import PaginatedResponse, PaginationParams
from app.main import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse, MaintenanceDetailResponse

router = APIRouter(prefix="/maintenances", tags=["maintenance"])
logger = get_logger("dashboard_maintenance")


@router.get("/{maintenance_id}", response_model=MaintenanceDetailResponse)
async def get_maintenance(
    maintenance_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single maintenance with components."""
    logger.info("maintenance_get", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    return MaintenanceDetailResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        component_ids=[str(c.id) for c in maintenance.components],
    )


@router.patch("/{maintenance_id}", response_model=MaintenanceDetailResponse)
async def update_maintenance(
    maintenance_id: str,
    data: MaintenanceUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Update a maintenance."""
    logger.info("maintenance_update", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    # Update fields
    if data.title is not None:
        maintenance.title = data.title
    if data.description is not None:
        maintenance.description = data.description
    if data.scheduled_start is not None:
        maintenance.scheduled_start = data.scheduled_start
    if data.scheduled_end is not None:
        maintenance.scheduled_end = data.scheduled_end
    if data.status is not None:
        maintenance.status = data.status

    # Update components
    if data.component_ids is not None:
        result = await db.execute(
            select(Component).where(
                Component.id.in_([uuid.UUID(cid) for cid in data.component_ids]),
                Component.deleted_at.is_(None),
            )
        )
        components = result.scalars().all()
        maintenance.components = list(components)

    await db.commit()
    await db.refresh(maintenance)

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.updated",
        entity_type="maintenance",
        entity_id=maintenance.id,
        changes={"title": maintenance.title, "status": maintenance.status.value},
        meta={"project_id": str(maintenance.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, str(maintenance.project_id), maintenance_id, "updated",
        {"title": maintenance.title, "status": maintenance.status.value}
    )

    return MaintenanceDetailResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        component_ids=[str(c.id) for c in maintenance.components],
    )


@router.delete("/{maintenance_id}")
async def delete_maintenance(
    maintenance_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Soft delete a maintenance."""
    logger.info("maintenance_delete", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    # Soft delete
    maintenance.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.deleted",
        entity_type="maintenance",
        entity_id=maintenance.id,
        meta={"project_id": str(maintenance.project_id), "title": maintenance.title},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, str(maintenance.project_id), maintenance_id, "deleted"
    )

    return {"message": "Maintenance deleted"}


@router.post("/{maintenance_id}/start", response_model=MaintenanceDetailResponse)
async def start_maintenance(
    maintenance_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Mark maintenance as in_progress."""
    logger.info("maintenance_start", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    if maintenance.status != MaintenanceStatus.scheduled:
        raise NotFoundError("Maintenance can only be started from scheduled status")

    maintenance.status = MaintenanceStatus.in_progress
    await db.commit()
    await db.refresh(maintenance)

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.started",
        entity_type="maintenance",
        entity_id=maintenance.id,
        changes={"status": "in_progress"},
        meta={"project_id": str(maintenance.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, str(maintenance.project_id), maintenance_id, "started",
        {"title": maintenance.title, "status": "in_progress"}
    )

    return MaintenanceDetailResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        component_ids=[str(c.id) for c in maintenance.components],
    )


@router.post("/{maintenance_id}/complete", response_model=MaintenanceDetailResponse)
async def complete_maintenance(
    maintenance_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Mark maintenance as completed."""
    logger.info("maintenance_complete", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    maintenance.status = MaintenanceStatus.completed
    await db.commit()
    await db.refresh(maintenance)

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.completed",
        entity_type="maintenance",
        entity_id=maintenance.id,
        changes={"status": "completed"},
        meta={"project_id": str(maintenance.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, str(maintenance.project_id), maintenance_id, "completed",
        {"title": maintenance.title, "status": "completed"}
    )

    return MaintenanceDetailResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        component_ids=[str(c.id) for c in maintenance.components],
    )


@router.post("/{maintenance_id}/cancel", response_model=MaintenanceDetailResponse)
async def cancel_maintenance(
    maintenance_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Cancel a scheduled maintenance."""
    logger.info("maintenance_cancel", maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == uuid.UUID(maintenance_id),
            Maintenance.deleted_at.is_(None),
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise NotFoundError("Maintenance not found")

    maintenance.status = MaintenanceStatus.cancelled
    await db.commit()
    await db.refresh(maintenance)

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.cancelled",
        entity_type="maintenance",
        entity_id=maintenance.id,
        changes={"status": "cancelled"},
        meta={"project_id": str(maintenance.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, str(maintenance.project_id), maintenance_id, "cancelled",
        {"title": maintenance.title, "status": "cancelled"}
    )

    return MaintenanceDetailResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        component_ids=[str(c.id) for c in maintenance.components],
    )
