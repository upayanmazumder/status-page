"""Audit log endpoints for Dashboard Service."""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from shared import get_current_user, get_async_session, NotFoundError
from shared.models import AuditLog, Project
from shared.logging import get_logger
from shared.schemas import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/audit-logs", tags=["audit"])
logger = get_logger("dashboard_audit")


@router.get("")
async def get_audit_logs(
    project_id: str,
    pagination: PaginationParams = Depends(),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get audit logs for a project."""
    logger.info("audit_logs", project_id=project_id)
    
    # Find org_id from project
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    
    query = select(AuditLog).where(AuditLog.org_id == project.org_id)
    
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()
    
    result = await db.execute(
        query.order_by(AuditLog.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    logs = result.scalars().all()
    
    items = [
        {
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "changes": log.changes,
            "meta": log.meta,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
    
    return PaginatedResponse.create(
        items=items, total=total, page=pagination.page, limit=pagination.limit
    )
