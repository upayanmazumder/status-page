"""API Gateway - Entry point for all client requests"""
import asyncio
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import structlog

from shared import (
    configure_logging,
    get_settings,
    JWTManager,
    setup_error_handlers,
    AuthenticationError,
    RateLimitError,
    HealthCheck,
    get_redis,
)
from shared.logging import get_logger
from shared.metrics import setup_metrics
import redis.asyncio as redis
from app.circuit_breaker import registry as circuit_registry

configure_logging()
logger = get_logger("gateway")

app = FastAPI(title="API Gateway", version="1.0.0")
setup_error_handlers(app)
setup_metrics(app, "gateway", "1.0.0")

settings = get_settings()
security = HTTPBearer(auto_error=False)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from environment
SERVICE_URLS = {
    "auth": settings.AUTH_SERVICE_URL or "http://auth-service:8000",
    "monitor": settings.MONITOR_SERVICE_URL or "http://monitor-service:8000",
    "notify": settings.NOTIFY_SERVICE_URL or "http://notify-service:8000",
    "dashboard": settings.DASHBOARD_SERVICE_URL or "http://dashboard-service:8000",
    "status": settings.STATUS_SERVICE_URL or "http://status-service:8000",
}

# Track ongoing requests for graceful shutdown
active_requests = set()


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Extract user from JWT if present."""
    if not credentials:
        return None
    try:
        return JWTManager.decode_access_token(credentials.credentials)
    except Exception:
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Require valid JWT token."""
    if not credentials:
        raise AuthenticationError("Authentication required")
    try:
        return JWTManager.decode_access_token(credentials.credentials)
    except Exception as e:
        raise AuthenticationError(f"Invalid token: {str(e)}")


async def check_rate_limit(redis_client: redis.Redis, key: str, limit: int, window: int) -> bool:
    """Simple rate limit check using Redis."""
    current = await redis_client.get(key)
    if current and int(current) >= limit:
        return False
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    await pipe.execute()
    return True


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all requests with timing."""
    request_id = request.headers.get("X-Request-ID", str(id(request)))
    logger.info(
        "request_started",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None,
    )

    active_requests.add(request_id)
    try:
        response = await call_next(request)
        logger.info(
            "request_completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )
        return response
    except Exception as e:
        logger.error(
            "request_failed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            error=str(e),
        )
        raise
    finally:
        active_requests.discard(request_id)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting by IP."""
    # Skip for health checks
    if request.url.path == "/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    redis_client = await get_redis()

    # 100 requests per minute per IP
    allowed = await check_rate_limit(redis_client, f"rate_limit:ip:{client_ip}", 100, 60)
    if not allowed:
        raise RateLimitError("Rate limit exceeded. Try again later.")

    return await call_next(request)


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Gateway health check + downstream service health."""
    healthy = True
    services = {}

    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, url in SERVICE_URLS.items():
            try:
                response = await client.get(f"{url}/health")
                services[service_name] = "healthy" if response.status_code == 200 else "unhealthy"
                if response.status_code != 200:
                    healthy = False
            except Exception as e:
                services[service_name] = "unreachable"
                healthy = False
                logger.warning("service_health_check_failed", service=service_name, error=str(e))

    status_code = 200 if healthy else 503
    return JSONResponse(
        content=HealthCheck(
            status="healthy" if healthy else "degraded",
            service="gateway",
            details=services,
        ).model_dump(),
        status_code=status_code,
    )


async def proxy_request(
    service_name: str,
    path: str,
    request: Request,
    user: Optional[dict] = None,
    stream: bool = False,
) -> JSONResponse | StreamingResponse:
    """Proxy request to downstream service with auth forwarding."""
    if service_name not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service_name}")

    url = f"{SERVICE_URLS[service_name]}{path}"
    method = request.method

    # Copy headers and add auth info
    headers = dict(request.headers)
    headers.pop("host", None)
    if user:
        headers["X-User-ID"] = user["sub"]
        if "org_id" in user:
            headers["X-Org-ID"] = user["org_id"]
        if "role" in user:
            headers["X-User-Role"] = user["role"]

    # Circuit breaker check
    cb = circuit_registry.get(service_name)
    if not cb.can_execute():
        logger.warning("circuit_breaker_open_rejecting", service=service_name)
        raise HTTPException(status_code=503, detail=f"Service {service_name} temporarily unavailable (circuit breaker open)")

    try:
        body = await request.body() if method in ["POST", "PUT", "PATCH"] else None

        async with httpx.AsyncClient(timeout=30.0) as client:
            req = client.build_request(
                method=method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
            )

            if stream:
                # For SSE, stream the response
                response = await client.send(req, stream=True)
                # Record success for non-error status codes
                if response.status_code < 500:
                    cb.record_success()
                else:
                    cb.record_failure()
                return StreamingResponse(
                    response.aiter_text(),
                    status_code=response.status_code,
                    media_type=response.headers.get("content-type", "text/event-stream"),
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                )
            else:
                response = await client.send(req)
                # Record success for non-error status codes
                if response.status_code < 500:
                    cb.record_success()
                else:
                    cb.record_failure()
                content = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                return JSONResponse(
                    content=content,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                )
    except httpx.RequestError as e:
        cb.record_failure()
        logger.error("proxy_request_failed", service=service_name, error=str(e))
        raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable")


# Auth routes (public)
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def auth_proxy(path: str, request: Request):
    return await proxy_request("auth", f"/{path}", request)


# Dashboard routes (require auth)
@app.api_route("/dashboard/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def dashboard_proxy(
    path: str,
    request: Request,
    user: dict = Depends(require_auth),
):
    return await proxy_request("dashboard", f"/{path}", request, user=user)


# Monitor routes (require auth)
@app.api_route("/monitor/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def monitor_proxy(
    path: str,
    request: Request,
    user: dict = Depends(require_auth),
):
    return await proxy_request("monitor", f"/{path}", request, user=user)


# Notify routes (require auth)
@app.api_route("/notify/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def notify_proxy(
    path: str,
    request: Request,
    user: dict = Depends(require_auth),
):
    return await proxy_request("notify", f"/{path}", request, user=user)


# Status routes (public, but forward auth if present)
@app.api_route("/status/{path:path}", methods=["GET"])
async def status_proxy(path: str, request: Request, user: Optional[dict] = Depends(get_current_user_optional)):
    return await proxy_request("status", f"/{path}", request, user=user)


# Events (SSE passthrough)
@app.get("/events/{path:path}")
async def events_proxy(path: str, request: Request):
    return await proxy_request("status", f"/events/{path}", request, stream=True)


# Circuit breaker status
@app.get("/circuit-breakers")
async def circuit_breaker_status():
    """Get circuit breaker status for all services."""
    return circuit_registry.get_state()
