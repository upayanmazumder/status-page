"""Notify Service - Notifications & Webhooks"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from shared import (
    configure_logging,
    get_settings,
    DatabaseManager,
    get_async_session,
    setup_error_handlers,
    get_current_user,
    HealthCheck,
    NotFoundError,
    ValidationError,
)
from shared.models import Subscriber, Incident, Maintenance
from shared.logging import get_logger

configure_logging()
logger = get_logger("notify_service")

app = FastAPI(title="Notify Service", version="1.0.0")
setup_error_handlers(app)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Schemas
class SubscriberCreate(BaseModel):
    email: Optional[EmailStr] = None
    webhook_url: Optional[str] = Field(None, max_length=500)
    notify_incident: bool = True
    notify_maintenance: bool = False

    def model_post_init(self, __context):
        if not self.email and not self.webhook_url:
            raise ValueError("Either email or webhook_url must be provided")


class SubscriberResponse(BaseModel):
    id: str
    project_id: str
    email: Optional[str]
    webhook_url: Optional[str]
    verified: bool
    notify_incident: bool
    notify_maintenance: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationRequest(BaseModel):
    subscriber_ids: List[str]
    subject: str
    body: str
    type: str  # incident, maintenance


class WebhookPayload(BaseModel):
    event: str
    data: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(status="ok", service="notify")


# Email sending (simplified - in production use a proper email service)
async def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email notification."""
    logger.info("sending_email", to=to_email, subject=subject)

    # For development, just log the email
    # In production, integrate with SendGrid, AWS SES, etc.
    if settings.smtp_host:
        import aiosmtplib
        try:
            await aiosmtplib.send(
                message=f"Subject: {subject}\n\n{body}",
                sender=settings.smtp_from,
                recipients=[to_email],
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                use_tls=True,
            )
            return True
        except Exception as e:
            logger.error("email_send_failed", to=to_email, error=str(e))
            return False
    else:
        logger.info("email_no_smtp_configured", to=to_email)
        return True  # Pretend it worked for dev


async def send_webhook(webhook_url: str, payload: WebhookPayload) -> bool:
    """Send a webhook notification."""
    logger.info("sending_webhook", url=webhook_url)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                webhook_url,
                json=payload.model_dump(),
                headers={"Content-Type": "application/json"},
            )
            return response.status_code < 400
    except Exception as e:
        logger.error("webhook_send_failed", url=webhook_url, error=str(e))
        return False


# Subscribers
@app.post("/subscribers/{project_id}", response_model=SubscriberResponse)
async def create_subscriber(
    project_id: str,
    data: SubscriberCreate,
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("subscriber_create", project_id=project_id, email=data.email)

    # Generate verification token
    verification_token = str(uuid.uuid4())

    subscriber = Subscriber(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        org_id=uuid.uuid4(),  # Should be looked up from project
        email=data.email,
        webhook_url=data.webhook_url,
        verified=False,
        verification_token=verification_token,
        notify_incident=data.notify_incident,
        notify_maintenance=data.notify_maintenance,
    )
    db.add(subscriber)
    await db.commit()
    await db.refresh(subscriber)

    # Send verification email if email provided
    if data.email:
        await send_email(
            to_email=data.email,
            subject="Verify your subscription",
            body=f"Click to verify: /verify/{verification_token}",
        )

    return SubscriberResponse(
        id=str(subscriber.id),
        project_id=str(subscriber.project_id),
        email=subscriber.email,
        webhook_url=subscriber.webhook_url,
        verified=subscriber.verified,
        notify_incident=subscriber.notify_incident,
        notify_maintenance=subscriber.notify_maintenance,
        created_at=subscriber.created_at,
    )


@app.get("/subscribers/{project_id}")
async def get_subscribers(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(Subscriber)
        .where(
            Subscriber.project_id == uuid.UUID(project_id),
            Subscriber.deleted_at.is_(None),
        )
        .order_by(Subscriber.created_at)
    )
    subscribers = result.scalars().all()

    return [
        SubscriberResponse(
            id=str(s.id),
            project_id=str(s.project_id),
            email=s.email,
            webhook_url=s.webhook_url,
            verified=s.verified,
            notify_incident=s.notify_incident,
            notify_maintenance=s.notify_maintenance,
            created_at=s.created_at,
        )
        for s in subscribers
    ]


@app.get("/verify/{token}")
async def verify_subscriber(
    token: str,
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(Subscriber).where(Subscriber.verification_token == token)
    )
    subscriber = result.scalar_one_or_none()

    if not subscriber:
        raise NotFoundError("Invalid verification token")

    subscriber.verified = True
    subscriber.verification_token = None
    await db.commit()

    return {"message": "Email verified successfully"}


@app.delete("/subscribers/{subscriber_id}")
async def delete_subscriber(
    subscriber_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    logger.info("subscriber_delete", subscriber_id=subscriber_id)

    result = await db.execute(
        select(Subscriber).where(Subscriber.id == uuid.UUID(subscriber_id))
    )
    subscriber = result.scalar_one_or_none()

    if not subscriber:
        raise NotFoundError("Subscriber not found")

    # Soft delete
    subscriber.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Subscriber removed"}


# Notifications
@app.post("/notify/{project_id}/incident")
async def notify_incident(
    project_id: str,
    incident_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Notify all incident subscribers about a new incident."""
    logger.info("notify_incident", project_id=project_id, incident_id=incident_id)

    # Get incident
    result = await db.execute(
        select(Incident).where(Incident.id == uuid.UUID(incident_id))
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise NotFoundError("Incident not found")

    # Get verified incident subscribers
    result = await db.execute(
        select(Subscriber)
        .where(
            Subscriber.project_id == uuid.UUID(project_id),
            Subscriber.verified.is_(True),
            Subscriber.notify_incident.is_(True),
            Subscriber.deleted_at.is_(None),
        )
    )
    subscribers = result.scalars().all()

    # Send notifications
    for sub in subscribers:
        if sub.email:
            await send_email(
                to_email=sub.email,
                subject=f"Incident: {incident.title}",
                body=f"Status: {incident.status.value}\nImpact: {incident.impact.value}",
            )
        if sub.webhook_url:
            await send_webhook(
                webhook_url=sub.webhook_url,
                payload=WebhookPayload(
                    event="incident.created",
                    data={
                        "incident_id": str(incident.id),
                        "title": incident.title,
                        "status": incident.status.value,
                        "impact": incident.impact.value,
                    },
                ),
            )

    return {"message": f"Notified {len(subscribers)} subscribers"}


@app.post("/notify/{project_id}/maintenance")
async def notify_maintenance(
    project_id: str,
    maintenance_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Notify all maintenance subscribers."""
    logger.info("notify_maintenance", project_id=project_id, maintenance_id=maintenance_id)

    result = await db.execute(
        select(Maintenance).where(Maintenance.id == uuid.UUID(maintenance_id))
    )
    maintenance = result.scalar_one_or_none()
    if not maintenance:
        raise NotFoundError("Maintenance not found")

    # Get verified maintenance subscribers
    result = await db.execute(
        select(Subscriber)
        .where(
            Subscriber.project_id == uuid.UUID(project_id),
            Subscriber.verified.is_(True),
            Subscriber.notify_maintenance.is_(True),
            Subscriber.deleted_at.is_(None),
        )
    )
    subscribers = result.scalars().all()

    for sub in subscribers:
        if sub.email:
            await send_email(
                to_email=sub.email,
                subject=f"Scheduled Maintenance: {maintenance.title}",
                body=f"Scheduled: {maintenance.scheduled_start} - {maintenance.scheduled_end}",
            )
        if sub.webhook_url:
            await send_webhook(
                webhook_url=sub.webhook_url,
                payload=WebhookPayload(
                    event="maintenance.scheduled",
                    data={
                        "maintenance_id": str(maintenance.id),
                        "title": maintenance.title,
                        "scheduled_start": maintenance.scheduled_start.isoformat(),
                        "scheduled_end": maintenance.scheduled_end.isoformat(),
                    },
                ),
            )

    return {"message": f"Notified {len(subscribers)} subscribers"}
