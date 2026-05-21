"""Status Service - Public Status Pages & Real-time Updates"""
import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from shared import (
    configure_logging,
    get_settings,
    DatabaseManager,
    get_async_session,
    get_redis,
    setup_error_handlers,
    HealthCheck,
    NotFoundError,
)
from shared.models import (
    Organization,
    Project,
    Component,
    ComponentStatus,
    Incident,
    IncidentStatus,
    Maintenance,
    MaintenanceStatus,
)
from shared.logging import get_logger

configure_logging()
logger = get_logger("status_service")

app = FastAPI(title="Status Service", version="1.0.0")
setup_error_handlers(app)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Public pages - allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Schemas
class PublicComponent(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    group_name: Optional[str]


class PublicIncident(BaseModel):
    id: str
    title: str
    status: str
    impact: str
    created_at: datetime
    resolved_at: Optional[datetime]


class PublicMaintenance(BaseModel):
    id: str
    title: str
    status: str
    scheduled_start: datetime
    scheduled_end: datetime


class StatusPageResponse(BaseModel):
    org_name: str
    project_name: str
    overall_status: str
    components: list[PublicComponent]
    active_incidents: list[PublicIncident]
    upcoming_maintenances: list[PublicMaintenance]
    updated_at: datetime


class MetricsResponse(BaseModel):
    uptime_percentage: float
    period: str
    total_checks: int
    failed_checks: int


# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(status="ok", service="status")


async def get_org_by_slug(db: AsyncSession, slug: str) -> Organization:
    """Get organization by slug."""
    result = await db.execute(
        select(Organization).where(
            Organization.slug == slug,
            Organization.deleted_at.is_(None),
        )
    )
    org = result.scalar_one_or_none()
    if not org:
        raise NotFoundError("Organization not found")
    return org


async def get_project_by_slug(db: AsyncSession, org_id, slug: str) -> Project:
    """Get project by slug within an organization."""
    result = await db.execute(
        select(Project).where(
            Project.org_id == org_id,
            Project.slug == slug,
            Project.deleted_at.is_(None),
            Project.is_public.is_(True),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    return project


@app.get("/status/{org_slug}/{project_slug}", response_model=StatusPageResponse)
async def get_status_page(
    org_slug: str,
    project_slug: str,
    db: AsyncSession = Depends(get_async_session),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Get public status page data."""
    logger.info("status_page_request", org_slug=org_slug, project_slug=project_slug)

    # Try cache first
    cache_key = f"status:{org_slug}:{project_slug}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return StatusPageResponse.model_validate_json(cached)
    except Exception:
        pass  # Cache miss or Redis error

    # Get org and project
    org = await get_org_by_slug(db, org_slug)
    project = await get_project_by_slug(db, org.id, project_slug)

    # Get components
    result = await db.execute(
        select(Component)
        .where(
            Component.project_id == project.id,
            Component.deleted_at.is_(None),
        )
        .order_by(Component.position)
    )
    components = result.scalars().all()

    # Determine overall status
    statuses = [c.status for c in components]
    overall_status = "operational"
    if any(s == ComponentStatus.major_outage for s in statuses):
        overall_status = "major_outage"
    elif any(s == ComponentStatus.partial_outage for s in statuses):
        overall_status = "partial_outage"
    elif any(s == ComponentStatus.degraded_performance for s in statuses):
        overall_status = "degraded_performance"
    elif any(s == ComponentStatus.under_maintenance for s in statuses):
        overall_status = "under_maintenance"

    # Get active incidents
    result = await db.execute(
        select(Incident)
        .where(
            Incident.project_id == project.id,
            Incident.status != IncidentStatus.resolved,
        )
        .order_by(Incident.created_at.desc())
    )
    incidents = result.scalars().all()

    # Get upcoming maintenances
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Maintenance)
        .where(
            Maintenance.project_id == project.id,
            Maintenance.status.in_([MaintenanceStatus.scheduled, MaintenanceStatus.in_progress]),
            Maintenance.deleted_at.is_(None),
            Maintenance.scheduled_end > now,
        )
        .order_by(Maintenance.scheduled_start)
    )
    maintenances = result.scalars().all()

    response = StatusPageResponse(
        org_name=org.name,
        project_name=project.name,
        overall_status=overall_status,
        components=[
            PublicComponent(
                id=str(c.id),
                name=c.name,
                description=c.description,
                status=c.status.value,
                group_name=c.group.name if c.group else None,
            )
            for c in components
        ],
        active_incidents=[
            PublicIncident(
                id=str(i.id),
                title=i.title,
                status=i.status.value,
                impact=i.impact.value,
                created_at=i.created_at,
                resolved_at=i.resolved_at,
            )
            for i in incidents
        ],
        upcoming_maintenances=[
            PublicMaintenance(
                id=str(m.id),
                title=m.title,
                status=m.status.value,
                scheduled_start=m.scheduled_start,
                scheduled_end=m.scheduled_end,
            )
            for m in maintenances
        ],
        updated_at=now,
    )

    # Cache for 30 seconds
    try:
        await redis_client.setex(cache_key, 30, response.model_dump_json())
    except Exception:
        pass

    return response


@app.get("/status/{org_slug}/{project_slug}/metrics", response_model=MetricsResponse)
async def get_metrics(
    org_slug: str,
    project_slug: str,
    period: str = "30d",
    db: AsyncSession = Depends(get_async_session),
):
    """Get uptime metrics for a project."""
    logger.info("metrics_request", org_slug=org_slug, project_slug=project_slug, period=period)

    org = await get_org_by_slug(db, org_slug)
    project = await get_project_by_slug(db, org.id, project_slug)

    # Calculate uptime from incidents (simplified)
    # In production, you'd aggregate from check_history
    result = await db.execute(
        select(func.count(Incident.id))
        .where(
            Incident.project_id == project.id,
            Incident.status == IncidentStatus.resolved,
        )
    )
    resolved_count = result.scalar() or 0

    # Simplified uptime calculation
    uptime = 99.9 if resolved_count == 0 else max(95.0, 100.0 - (resolved_count * 0.1))

    return MetricsResponse(
        uptime_percentage=round(uptime, 2),
        period=period,
        total_checks=1000,  # Placeholder
        failed_checks=resolved_count,
    )


@app.get("/events/{org_slug}/{project_slug}")
async def events_stream(
    org_slug: str,
    project_slug: str,
    request: Request,
    redis_client: redis.Redis = Depends(get_redis),
):
    """SSE endpoint for real-time status updates."""
    logger.info("sse_connect", org_slug=org_slug, project_slug=project_slug)

    channel = f"events:{org_slug}:{project_slug}"

    async def event_generator():
        try:
            # Subscribe to Redis channel
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(channel)

            # Send initial connection event
            yield f"event: connected\ndata: {{\"channel\": \"{channel}\"}}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=15)
                if message and message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
                else:
                    # Send heartbeat
                    yield ": heartbeat\n\n"

        except asyncio.CancelledError:
            logger.info("sse_disconnect", org_slug=org_slug)
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
