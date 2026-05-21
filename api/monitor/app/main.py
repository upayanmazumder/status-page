"""Monitor Service - Health Checks & Monitoring"""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional, List

import httpx
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from shared import (
    configure_logging,
    get_settings,
    DatabaseManager,
    get_async_session,
    get_redis,
    setup_error_handlers,
    get_current_user,
    HealthCheck,
    NotFoundError,
    ValidationError,
)
from shared.models import (
    Component,
    UptimeCheck,
    CheckMethod,
    CheckResult,
    CheckHistory,
)
from shared.logging import get_logger
import redis.asyncio as redis

configure_logging()
logger = get_logger("monitor_service")

app = FastAPI(title="Monitor Service", version="1.0.0")
setup_error_handlers(app)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include startup events
from app.startup import startup_event
app.add_event_handler("startup", startup_event)


# Schemas
class CheckConfigCreate(BaseModel):
    component_id: str
    name: str = Field(..., min_length=1, max_length=255)
    method: CheckMethod
    target: str = Field(..., min_length=1, max_length=500)
    interval: int = Field(default=60, ge=30, le=3600)
    timeout_ms: int = Field(default=10000, ge=1000, le=60000)
    regions: List[str] = []


class CheckConfigResponse(BaseModel):
    id: str
    component_id: str
    name: str
    method: str
    target: str
    interval: int
    timeout_ms: int
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CheckResultResponse(BaseModel):
    id: str
    check_id: str
    component_id: str
    region: str
    result: str
    status_code: Optional[int]
    response_time_ms: Optional[int]
    error_message: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(status="ok", service="monitor")


async def execute_http_check(check: UptimeCheck) -> CheckResultResponse:
    """Execute an HTTP health check."""
    start = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient(timeout=check.timeout_ms / 1000.0) as client:
            response = await client.get(check.target)
            elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000

            if response.status_code < 400:
                result = CheckResult.up
            elif response.status_code < 500:
                result = CheckResult.degraded
            else:
                result = CheckResult.down

            return CheckResultResponse(
                id=str(uuid.uuid4()),
                check_id=str(check.id),
                component_id=str(check.component_id),
                region="default",
                result=result.value,
                status_code=response.status_code,
                response_time_ms=int(elapsed),
                error_message=None,
                checked_at=datetime.now(timezone.utc),
            )
    except httpx.TimeoutException:
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.timeout.value,
            status_code=None,
            response_time_ms=check.timeout_ms,
            error_message="Request timed out",
            checked_at=datetime.now(timezone.utc),
        )
    except Exception as e:
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.down.value,
            status_code=None,
            response_time_ms=None,
            error_message=str(e),
            checked_at=datetime.now(timezone.utc),
        )


async def execute_tcp_check(check: UptimeCheck) -> CheckResultResponse:
    """Execute a TCP health check."""
    import socket
    start = datetime.now(timezone.utc)
    try:
        host, port = check.target.split(":")
        port = int(port)

        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=check.timeout_ms / 1000.0,
        )
        writer.close()
        await writer.wait_closed()

        elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.up.value,
            status_code=None,
            response_time_ms=int(elapsed),
            error_message=None,
            checked_at=datetime.now(timezone.utc),
        )
    except asyncio.TimeoutError:
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.timeout.value,
            status_code=None,
            response_time_ms=check.timeout_ms,
            error_message="TCP connection timed out",
            checked_at=datetime.now(timezone.utc),
        )
    except Exception as e:
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.down.value,
            status_code=None,
            response_time_ms=None,
            error_message=str(e),
            checked_at=datetime.now(timezone.utc),
        )


async def execute_check(check: UptimeCheck) -> CheckResultResponse:
    """Execute a health check based on its method."""
    if check.method == CheckMethod.http:
        return await execute_http_check(check)
    elif check.method == CheckMethod.tcp:
        return await execute_tcp_check(check)
    else:
        return CheckResultResponse(
            id=str(uuid.uuid4()),
            check_id=str(check.id),
            component_id=str(check.component_id),
            region="default",
            result=CheckResult.down.value,
            status_code=None,
            response_time_ms=None,
            error_message=f"Method {check.method} not yet implemented",
            checked_at=datetime.now(timezone.utc),
        )


# CRUD endpoints
@app.post("/checks", response_model=CheckConfigResponse)
async def create_check(
    data: CheckConfigCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("check_create", component_id=data.component_id, name=data.name)

    # Verify component exists
    result = await db.execute(
        select(Component).where(
            Component.id == uuid.UUID(data.component_id),
            Component.deleted_at.is_(None),
        )
    )
    component = result.scalar_one_or_none()
    if not component:
        raise NotFoundError("Component not found")

    check = UptimeCheck(
        id=uuid.uuid4(),
        component_id=uuid.UUID(data.component_id),
        project_id=component.project_id,
        org_id=component.project_id,  # Simplified - should lookup project
        name=data.name,
        method=data.method,
        target=data.target,
        interval=data.interval,
        timeout_ms=data.timeout_ms,
        regions=data.regions,
        enabled=True,
    )
    db.add(check)
    await db.commit()
    await db.refresh(check)

    return CheckConfigResponse(
        id=str(check.id),
        component_id=str(check.component_id),
        name=check.name,
        method=check.method.value,
        target=check.target,
        interval=check.interval,
        timeout_ms=check.timeout_ms,
        enabled=check.enabled,
        created_at=check.created_at,
    )


@app.get("/checks/{component_id}")
async def get_checks(
    component_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(UptimeCheck)
        .where(
            UptimeCheck.component_id == uuid.UUID(component_id),
            UptimeCheck.deleted_at.is_(None),
        )
        .order_by(UptimeCheck.created_at)
    )
    checks = result.scalars().all()

    return [
        CheckConfigResponse(
            id=str(c.id),
            component_id=str(c.component_id),
            name=c.name,
            method=c.method.value,
            target=c.target,
            interval=c.interval,
            timeout_ms=c.timeout_ms,
            enabled=c.enabled,
            created_at=c.created_at,
        )
        for c in checks
    ]


@app.post("/checks/{check_id}/run", response_model=CheckResultResponse)
async def run_check(
    check_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("check_run", check_id=check_id)

    result = await db.execute(
        select(UptimeCheck)
        .where(
            UptimeCheck.id == uuid.UUID(check_id),
            UptimeCheck.deleted_at.is_(None),
        )
    )
    check = result.scalar_one_or_none()
    if not check:
        raise NotFoundError("Check not found")

    result_data = await execute_check(check)

    # Store result in DB
    history = CheckHistory(
        id=uuid.UUID(result_data.id),
        check_id=uuid.UUID(check_id),
        component_id=check.component_id,
        region=result_data.region,
        result=CheckResult(result_data.result),
        status_code=result_data.status_code,
        response_time_ms=result_data.response_time_ms,
        error_message=result_data.error_message,
        checked_at=result_data.checked_at,
    )
    db.add(history)
    await db.commit()

    return result_data


@app.get("/history/{component_id}")
async def get_check_history(
    component_id: str,
    limit: int = 100,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(CheckHistory)
        .where(CheckHistory.component_id == uuid.UUID(component_id))
        .order_by(CheckHistory.checked_at.desc())
        .limit(limit)
    )
    history = result.scalars().all()

    return [
        CheckResultResponse(
            id=str(h.id),
            check_id=str(h.check_id),
            component_id=str(h.component_id),
            region=h.region,
            result=h.result.value,
            status_code=h.status_code,
            response_time_ms=h.response_time_ms,
            error_message=h.error_message,
            checked_at=h.checked_at,
        )
        for h in history
    ]


# Scheduler
from app.scheduler import start_scheduler, MonitorTaskScheduler


# Background check runner - replaced by scheduler
async def run_scheduled_checks_legacy():
    """Legacy background task - now delegates to scheduler."""
    logger.info("scheduled_check_runner_started")
    db_manager = DatabaseManager()
    
    try:
        while True:
            async with db_manager.session_factory() as db:
                from app.scheduler import run_scheduled_checks
                await run_scheduled_checks(db)
            await asyncio.sleep(30)
    except Exception as e:
        logger.error("scheduled_check_runner_error", error=str(e))
