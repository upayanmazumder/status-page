"""Auth Service - Authentication & Authorization"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import structlog

logger = structlog.get_logger()

app = FastAPI(title="Auth Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth"}


@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    logger.info("login_attempt", email=request.email)
    # TODO: Implement actual authentication
    return TokenResponse(access_token="dummy", expires_in=3600)


@app.post("/register")
async def register(user: User):
    logger.info("register_attempt", email=user.email)
    # TODO: Implement registration
    return {"message": "User registered", "user_id": user.id}


@app.get("/me", response_model=User)
async def get_current_user():
    # TODO: Implement JWT validation
    return User(id="user_123", email="user@example.com", name="Test User")


@app.post("/refresh")
async def refresh_token():
    # TODO: Implement token refresh
    return TokenResponse(access_token="new_dummy", expires_in=3600)
