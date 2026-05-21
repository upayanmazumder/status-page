"""Search endpoint for Dashboard Service."""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared import get_current_user, get_async_session
from shared.models import Component, Incident
from shared.logging import get_logger

router = APIRouter(prefix="/search", tags=["search"])
logger = get_logger("dashboard_search")


@router.get("")
async def search(
    q: str,
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Search across components and incidents."""
    logger.info("search", query=q, project_id=project_id)
    
    search_term = f"%{q}%"
    
    # Search components
    comp_result = await db.execute(
        select(Component)
        .where(
            Component.project_id == uuid.UUID(project_id),
            Component.deleted_at.is_(None),
            Component.name.ilike(search_term),
        )
        .limit(10)
    )
    components = comp_result.scalars().all()
    
    # Search incidents
    inc_result = await db.execute(
        select(Incident)
        .where(
            Incident.project_id == uuid.UUID(project_id),
            Incident.title.ilike(search_term),
        )
        .order_by(Incident.created_at.desc())
        .limit(10)
    )
    incidents = inc_result.scalars().all()
    
    return {
        "query": q,
        "components": [
            {"id": str(c.id), "name": c.name, "status": c.status.value, "type": "component"}
            for c in components
        ],
        "incidents": [
            {"id": str(i.id), "title": i.title, "status": i.status.value, "type": "incident"}
            for i in incidents
        ],
        "total": len(components) + len(incidents),
    }
