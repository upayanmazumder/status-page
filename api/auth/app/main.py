"""Auth Service - Authentication & Authorization"""
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared import (
    configure_logging,
    get_settings,
    JWTManager,
    DatabaseManager,
    get_async_session,
    setup_error_handlers,
    AuthenticationError,
    ValidationError,
    ConflictError,
    HealthCheck,
)
from shared.models import User, Organization, OrgMembership, OrganizationRole
from shared.logging import get_logger

# Configure logging
configure_logging()
logger = get_logger("auth_service")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Auth Service", version="1.0.0")

# Setup error handlers
setup_error_handlers(app)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)
    org_name: str = Field(..., min_length=1, max_length=255)
    org_slug: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    created_at: datetime


class MeResponse(BaseModel):
    user: UserResponse
    org_id: str | None = None
    role: str | None = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    return HealthCheck(status="ok", service="auth")


# Registration
@app.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_async_session)):
    logger.info("registration_attempt", email=request.email, org_slug=request.org_slug)

    # Check if user already exists
    existing_user = await db.execute(select(User).where(User.email == request.email))
    if existing_user.scalar_one_or_none():
        raise ConflictError("User with this email already exists")

    # Check if org slug is taken
    existing_org = await db.execute(select(Organization).where(Organization.slug == request.org_slug))
    if existing_org.scalar_one_or_none():
        raise ConflictError("Organization slug already taken")

    # Create user
    user = User(
        id=uuid.uuid4(),
        external_id=str(uuid.uuid4()),
        email=request.email,
        name=request.name,
    )
    db.add(user)

    # Create organization
    org = Organization(
        id=uuid.uuid4(),
        name=request.org_name,
        slug=request.org_slug,
    )
    db.add(org)

    # Create membership (owner)
    membership = OrgMembership(
        id=uuid.uuid4(),
        org_id=org.id,
        user_id=user.id,
        role=OrganizationRole.owner,
    )
    db.add(membership)

    await db.commit()

    # Generate tokens
    access_token = JWTManager.create_access_token(
        subject=str(user.id),
        org_id=str(org.id),
        role="owner",
    )
    refresh_token = JWTManager.create_refresh_token(subject=str(user.id))

    logger.info("user_registered", user_id=str(user.id), org_id=str(org.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expires_in,
    )


# Login
@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_async_session)):
    logger.info("login_attempt", email=request.email)

    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("Invalid email or password")

    # Get user's org membership
    result = await db.execute(
        select(OrgMembership)
        .where(OrgMembership.user_id == user.id)
        .order_by(OrgMembership.created_at)
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise AuthenticationError("User has no organization membership")

    # Generate tokens
    access_token = JWTManager.create_access_token(
        subject=str(user.id),
        org_id=str(membership.org_id),
        role=membership.role.value,
    )
    refresh_token = JWTManager.create_refresh_token(subject=str(user.id))

    logger.info("login_success", user_id=str(user.id), org_id=str(membership.org_id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expires_in,
    )


# Get current user
@app.get("/me", response_model=MeResponse)
async def get_current_user(
    credentials: str = Depends(security),
    db: AsyncSession = Depends(get_async_session),
):
    token = credentials.credentials
    payload = JWTManager.decode_access_token(token)
    user_id = payload["sub"]
    org_id = payload.get("org_id")
    role = payload.get("role")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User not found")

    return MeResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name or "",
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        ),
        org_id=org_id,
        role=role,
    )


# Refresh token
@app.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: dict):
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise ValidationError("Refresh token required")

    payload = JWTManager.decode_refresh_token(refresh_token)
    user_id = payload["sub"]

    # Generate new tokens
    access_token = JWTManager.create_access_token(subject=user_id)
    new_refresh_token = JWTManager.create_refresh_token(subject=user_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.jwt_expires_in,
    )
