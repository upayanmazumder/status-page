"""Dashboard Service - Component & Incident Management"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared import (
    configure_logging,
    get_settings,
    DatabaseManager,
    get_async_session,
    get_redis,
    setup_error_handlers,
    get_current_user,
    require_org_access,
    NotFoundError,
    ValidationError,
    HealthCheck,
    PaginatedResponse,
    PaginationParams,
)
from shared.events import EventPublisher
import redis.asyncio as redis
from shared.models import (
    AuditLog,
    Component,
    ComponentGroup,
    Incident,
    IncidentUpdate,
    Maintenance,
    Organization,
    Project,
    Subscriber,
    UptimeCheck,
    ComponentStatus,
    IncidentStatus,
    IncidentImpact,
    MaintenanceStatus,
)
from shared.logging import get_logger
from shared.metrics import setup_metrics

configure_logging()
logger = get_logger("dashboard_service")

app = FastAPI(title="Dashboard Service", version="1.0.0")
setup_error_handlers(app)
setup_metrics(app, "dashboard", "1.0.0")

# Include bulk operations router
from app.bulk import router as bulk_router
app.include_router(bulk_router)

# Include search router
from app.search import router as search_router
app.include_router(search_router)

# Include audit log router
from app.main_audit import router as audit_router
app.include_router(audit_router)

# Include maintenance router
from app.main_maintenance import router as maintenance_router
app.include_router(maintenance_router)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Schemas
class ComponentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    group_id: Optional[str] = None
    position: int = 0


class ComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ComponentStatus] = None
    group_id: Optional[str] = None
    position: Optional[int] = None


class ComponentResponse(BaseModel):
    id: str
    project_id: str
    group_id: Optional[str]
    name: str
    description: Optional[str]
    status: str
    position: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComponentGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    position: int = 0


class ComponentGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[int] = None


class ComponentGroupResponse(BaseModel):
    id: str
    project_id: str
    name: str
    position: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    status: IncidentStatus = IncidentStatus.investigating
    impact: IncidentImpact = IncidentImpact.none
    component_ids: List[str] = []


class IncidentUpdateCreate(BaseModel):
    message: str = Field(..., min_length=1)
    status: IncidentStatus


class IncidentUpdateResponse(BaseModel):
    id: str
    incident_id: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentDetailResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    impact: str
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    component_ids: List[str] = []
    updates: List[IncidentUpdateResponse] = []

    class Config:
        from_attributes = True


class IncidentResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    impact: str
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    component_ids: List[str] = []

    class Config:
        from_attributes = True


class MaintenanceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime
    component_ids: List[str] = []


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    component_ids: Optional[List[str]] = None
    status: Optional[MaintenanceStatus] = None


class MaintenanceResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    scheduled_start: datetime
    scheduled_end: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceDetailResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    status: str
    scheduled_start: datetime
    scheduled_end: datetime
    created_at: datetime
    updated_at: datetime
    component_ids: List[str] = []

    class Config:
        from_attributes = True


# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(status="ok", service="dashboard")


# Component Groups
@app.post("/groups", response_model=ComponentGroupResponse)
async def create_group(
    project_id: str,
    data: ComponentGroupCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("group_create", project_id=project_id, name=data.name)

    group = ComponentGroup(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        name=data.name,
        position=data.position,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)

    return ComponentGroupResponse(
        id=str(group.id),
        project_id=str(group.project_id),
        name=group.name,
        position=group.position,
        created_at=group.created_at,
        updated_at=group.updated_at,
    )


@app.get("/groups")
async def get_groups(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(ComponentGroup)
        .where(
            ComponentGroup.project_id == uuid.UUID(project_id),
            ComponentGroup.deleted_at.is_(None),
        )
        .order_by(ComponentGroup.position)
    )
    groups = result.scalars().all()

    return [
        ComponentGroupResponse(
            id=str(g.id),
            project_id=str(g.project_id),
            name=g.name,
            position=g.position,
            created_at=g.created_at,
            updated_at=g.updated_at,
        )
        for g in groups
    ]


@app.patch("/groups/{group_id}", response_model=ComponentGroupResponse)
async def update_group(
    group_id: str,
    data: ComponentGroupUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("group_update", group_id=group_id)

    result = await db.execute(
        select(ComponentGroup).where(
            ComponentGroup.id == uuid.UUID(group_id),
            ComponentGroup.deleted_at.is_(None),
        )
    )
    group = result.scalar_one_or_none()

    if not group:
        raise NotFoundError("Component group not found")

    if data.name is not None:
        group.name = data.name
    if data.position is not None:
        group.position = data.position

    await db.commit()
    await db.refresh(group)

    return ComponentGroupResponse(
        id=str(group.id),
        project_id=str(group.project_id),
        name=group.name,
        position=group.position,
        created_at=group.created_at,
        updated_at=group.updated_at,
    )


@app.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("group_delete", group_id=group_id)

    result = await db.execute(
        select(ComponentGroup).where(
            ComponentGroup.id == uuid.UUID(group_id),
            ComponentGroup.deleted_at.is_(None),
        )
    )
    group = result.scalar_one_or_none()

    if not group:
        raise NotFoundError("Component group not found")

    # Soft delete
    group.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Component group deleted"}


# Components
@app.post("/components", response_model=ComponentResponse)
async def create_component(
    project_id: str,
    data: ComponentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("component_create", project_id=project_id, name=data.name)

    component = Component(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        group_id=uuid.UUID(data.group_id) if data.group_id else None,
        name=data.name,
        description=data.description,
        position=data.position,
    )
    db.add(component)
    await db.commit()
    await db.refresh(component)

    # Create audit log
    audit = AuditLog(
        org_id=project.org_id,
        actor_id=user.get("id"),
        action="component.created",
        entity_type="component",
        entity_id=component.id,
        changes={"name": component.name, "status": component.status.value},
        meta={"project_id": str(project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event and invalidate cache
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_component_change(
        redis_client, org_slug, project_id, str(component.id), "created",
        {"name": component.name, "status": component.status.value}
    )

    return ComponentResponse(
        id=str(component.id),
        project_id=str(component.project_id),
        group_id=str(component.group_id) if component.group_id else None,
        name=component.name,
        description=component.description,
        status=component.status.value,
        position=component.position,
        created_at=component.created_at,
        updated_at=component.updated_at,
    )


@app.get("/components")
async def get_components(
    project_id: str,
    group_id: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    query = select(Component).where(
        Component.project_id == uuid.UUID(project_id),
        Component.deleted_at.is_(None),
    )

    if group_id:
        query = query.where(Component.group_id == uuid.UUID(group_id))

    # Get total count
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    # Get paginated results
    result = await db.execute(
        query.order_by(Component.position)
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    components = result.scalars().all()

    items = [
        ComponentResponse(
            id=str(c.id),
            project_id=str(c.project_id),
            group_id=str(c.group_id) if c.group_id else None,
            name=c.name,
            description=c.description,
            status=c.status.value,
            position=c.position,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in components
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=pagination.page, limit=pagination.limit
    )


@app.patch("/components/{component_id}", response_model=ComponentResponse)
async def update_component(
    component_id: str,
    data: ComponentUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("component_update", component_id=component_id)

    result = await db.execute(
        select(Component).where(
            Component.id == uuid.UUID(component_id),
            Component.deleted_at.is_(None),
        )
    )
    component = result.scalar_one_or_none()

    if not component:
        raise NotFoundError("Component not found")

    # Update fields
    if data.name is not None:
        component.name = data.name
    if data.description is not None:
        component.description = data.description
    if data.status is not None:
        component.status = data.status
    if data.group_id is not None:
        component.group_id = uuid.UUID(data.group_id) if data.group_id else None
    if data.position is not None:
        component.position = data.position

    await db.commit()
    await db.refresh(component)

    # Create audit log
    audit = AuditLog(
        org_id=component.project.org_id,
        actor_id=user.get("id"),
        action="component.updated",
        entity_type="component",
        entity_id=component.id,
        changes={"name": component.name, "status": component.status.value},
        meta={"project_id": str(component.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event and invalidate cache
    org_slug = user.get("org_id", "unknown")
    project_id = str(component.project_id)
    await EventPublisher.publish_component_change(
        redis_client, org_slug, project_id, component_id, "updated",
        {"name": component.name, "status": component.status.value}
    )

    return ComponentResponse(
        id=str(component.id),
        project_id=str(component.project_id),
        group_id=str(component.group_id) if component.group_id else None,
        name=component.name,
        description=component.description,
        status=component.status.value,
        position=component.position,
        created_at=component.created_at,
        updated_at=component.updated_at,
    )


@app.delete("/components/{component_id}")
async def delete_component(
    component_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("component_delete", component_id=component_id)

    result = await db.execute(
        select(Component).where(
            Component.id == uuid.UUID(component_id),
            Component.deleted_at.is_(None),
        )
    )
    component = result.scalar_one_or_none()

    if not component:
        raise NotFoundError("Component not found")

    # Soft delete
    component.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    # Create audit log
    audit = AuditLog(
        org_id=component.project.org_id,
        actor_id=user.get("id"),
        action="component.deleted",
        entity_type="component",
        entity_id=component.id,
        meta={"project_id": str(component.project_id), "name": component.name},
    )
    db.add(audit)
    await db.commit()

    # Publish event and invalidate cache
    org_slug = user.get("org_id", "unknown")
    project_id = str(component.project_id)
    await EventPublisher.publish_component_change(
        redis_client, org_slug, project_id, component_id, "deleted"
    )

    return {"message": "Component deleted"}


# Incidents
@app.post("/incidents", response_model=IncidentResponse)
async def create_incident(
    project_id: str,
    data: IncidentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("incident_create", project_id=project_id, title=data.title)

    org_id = user.get("org_id")

    incident = Incident(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        org_id=uuid.UUID(org_id),
        title=data.title,
        status=data.status,
        impact=data.impact,
    )
    db.add(incident)

    # Add affected components
    if data.component_ids:
        result = await db.execute(
            select(Component).where(
                Component.id.in_([uuid.UUID(cid) for cid in data.component_ids]),
                Component.deleted_at.is_(None),
            )
        )
        components = result.scalars().all()
        incident.components = list(components)

    await db.commit()
    await db.refresh(incident)

    # Create audit log
    audit = AuditLog(
        org_id=project.org_id,
        actor_id=user.get("id"),
        action="incident.created",
        entity_type="incident",
        entity_id=incident.id,
        changes={"title": incident.title, "status": incident.status.value, "impact": incident.impact.value},
        meta={"project_id": str(project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event and invalidate cache
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_incident_change(
        redis_client, org_slug, project_id, str(incident.id), "created",
        {"title": incident.title, "status": incident.status.value, "impact": incident.impact.value}
    )

    return IncidentResponse(
        id=str(incident.id),
        project_id=str(incident.project_id),
        title=incident.title,
        status=incident.status.value,
        impact=incident.impact.value,
        resolved_at=incident.resolved_at,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        component_ids=[str(c.id) for c in incident.components],
    )


@app.get("/incidents")
async def get_incidents(
    project_id: str,
    status_filter: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    query = select(Incident).where(Incident.project_id == uuid.UUID(project_id))

    if status_filter:
        query = query.where(Incident.status == IncidentStatus(status_filter))

    # Get total
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    # Get paginated
    result = await db.execute(
        query.order_by(Incident.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    incidents = result.scalars().all()

    items = [
        IncidentResponse(
            id=str(i.id),
            project_id=str(i.project_id),
            title=i.title,
            status=i.status.value,
            impact=i.impact.value,
            resolved_at=i.resolved_at,
            created_at=i.created_at,
            updated_at=i.updated_at,
            component_ids=[str(c.id) for c in i.components],
        )
        for i in incidents
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=pagination.page, limit=pagination.limit
    )


@app.get("/incidents/{incident_id}", response_model=IncidentDetailResponse)
async def get_incident_detail(
    incident_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get incident with full timeline."""
    logger.info("incident_detail", incident_id=incident_id)

    result = await db.execute(
        select(Incident).where(Incident.id == uuid.UUID(incident_id))
    )
    incident = result.scalar_one_or_none()

    if not incident:
        raise NotFoundError("Incident not found")

    # Fetch updates
    updates = [
        IncidentUpdateResponse(
            id=str(u.id),
            incident_id=str(u.incident_id),
            message=u.message,
            status=u.status.value,
            created_at=u.created_at,
        )
        for u in incident.updates
    ]

    return IncidentDetailResponse(
        id=str(incident.id),
        project_id=str(incident.project_id),
        title=incident.title,
        status=incident.status.value,
        impact=incident.impact.value,
        resolved_at=incident.resolved_at,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        component_ids=[str(c.id) for c in incident.components],
        updates=updates,
    )


@app.patch("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    data: IncidentUpdateCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("incident_update", incident_id=incident_id)

    result = await db.execute(
        select(Incident).where(Incident.id == uuid.UUID(incident_id))
    )
    incident = result.scalar_one_or_none()

    if not incident:
        raise NotFoundError("Incident not found")

    # Update incident status
    incident.status = data.status
    if data.status == IncidentStatus.resolved:
        incident.resolved_at = datetime.now(timezone.utc)

    # Add update
    update_entry = IncidentUpdate(
        id=uuid.uuid4(),
        incident_id=incident.id,
        message=data.message,
        status=data.status,
    )
    db.add(update_entry)

    await db.commit()
    await db.refresh(incident)

    # Create audit log
    action = "incident.resolved" if data.status == IncidentStatus.resolved else "incident.updated"
    audit = AuditLog(
        org_id=incident.org_id,
        actor_id=user.get("id"),
        action=action,
        entity_type="incident",
        entity_id=incident.id,
        changes={"title": incident.title, "status": incident.status.value, "message": data.message},
        meta={"project_id": str(incident.project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event and invalidate cache
    org_slug = user.get("org_id", "unknown")
    project_id = str(incident.project_id)
    action = "resolved" if data.status == IncidentStatus.resolved else "updated"
    await EventPublisher.publish_incident_change(
        redis_client, org_slug, project_id, incident_id, action,
        {"title": incident.title, "status": incident.status.value, "message": data.message}
    )

    return IncidentResponse(
        id=str(incident.id),
        project_id=str(incident.project_id),
        title=incident.title,
        status=incident.status.value,
        impact=incident.impact.value,
        resolved_at=incident.resolved_at,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        component_ids=[str(c.id) for c in incident.components],
    )


# Maintenance
@app.post("/maintenances", response_model=MaintenanceResponse)
async def create_maintenance(
    project_id: str,
    data: MaintenanceCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    logger.info("maintenance_create", project_id=project_id, title=data.title)

    org_id = user.get("org_id")

    maintenance = Maintenance(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        org_id=uuid.UUID(org_id),
        title=data.title,
        description=data.description,
        scheduled_start=data.scheduled_start,
        scheduled_end=data.scheduled_end,
    )

    # Add affected components
    if data.component_ids:
        result = await db.execute(
            select(Component).where(
                Component.id.in_([uuid.UUID(cid) for cid in data.component_ids]),
                Component.deleted_at.is_(None),
            )
        )
        components = result.scalars().all()
        maintenance.components = list(components)

    db.add(maintenance)
    await db.commit()
    await db.refresh(maintenance)

    # Audit log
    audit = AuditLog(
        org_id=maintenance.org_id,
        actor_id=user.get("id"),
        action="maintenance.created",
        entity_type="maintenance",
        entity_id=maintenance.id,
        changes={"title": maintenance.title, "status": maintenance.status.value},
        meta={"project_id": str(project_id)},
    )
    db.add(audit)
    await db.commit()

    # Publish event
    org_slug = user.get("org_id", "unknown")
    await EventPublisher.publish_maintenance_change(
        redis_client, org_slug, project_id, str(maintenance.id), "scheduled",
        {"title": maintenance.title, "status": maintenance.status.value}
    )

    return MaintenanceResponse(
        id=str(maintenance.id),
        project_id=str(maintenance.project_id),
        title=maintenance.title,
        status=maintenance.status.value,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        created_at=maintenance.created_at,
    )


@app.get("/maintenances")
async def get_maintenances(
    project_id: str,
    pagination: PaginationParams = Depends(),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    query = select(Maintenance).where(
        Maintenance.project_id == uuid.UUID(project_id),
        Maintenance.deleted_at.is_(None),
    )

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(Maintenance.scheduled_start.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    maintenances = result.scalars().all()

    items = [
        MaintenanceResponse(
            id=str(m.id),
            project_id=str(m.project_id),
            title=m.title,
            status=m.status.value,
            scheduled_start=m.scheduled_start,
            scheduled_end=m.scheduled_end,
            created_at=m.created_at,
        )
        for m in maintenances
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=pagination.page, limit=pagination.limit
    )
