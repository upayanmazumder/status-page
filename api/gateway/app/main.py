"""API Gateway - Entry point for all client requests"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import structlog
from typing import Optional

logger = structlog.get_logger()

app = FastAPI(title="API Gateway", version="1.0.0")

# Service URLs (configured via environment variables)
SERVICE_URLS = {
    "auth": "http://auth-service:8000",
    "monitor": "http://monitor-service:8000",
    "notify": "http://notify-service:8000",
    "dashboard": "http://dashboard-service:8000",
    "status": "http://status-service:8000",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure from env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None,
    )
    response = await call_next(request)
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
    )
    return response


@app.get("/health")
async def health_check():
    """Gateway health check + downstream service health"""
    healthy = True
    services = {}
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, url in SERVICE_URLS.items():
            try:
                response = await client.get(f"{url}/health")
                services[service_name] = "healthy" if response.status_code == 200 else "unhealthy"
                if response.status_code != 200:
                    healthy = False
            except Exception:
                services[service_name] = "unreachable"
                healthy = False
    
    status_code = 200 if healthy else 503
    return JSONResponse(
        content={"status": "healthy" if healthy else "degraded", "services": services},
        status_code=status_code,
    )


async def proxy_request(service_name: str, path: str, request: Request):
    """Proxy request to downstream service"""
    if service_name not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service_name}")
    
    url = f"{SERVICE_URLS[service_name]}{path}"
    method = request.method
    
    async with httpx.AsyncClient() as client:
        try:
            body = await request.body() if method in ["POST", "PUT", "PATCH"] else None
            headers = dict(request.headers)
            headers.pop("host", None)
            
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
                timeout=30.0,
            )
            return JSONResponse(
                content=response.json() if response.headers.get("content-type", "").startswith("application/json") else {},
                status_code=response.status_code,
                headers=dict(response.headers),
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable")


# Auth routes
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def auth_proxy(path: str, request: Request):
    return await proxy_request("auth", f"/{path}", request)


# Dashboard routes
@app.api_route("/dashboard/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def dashboard_proxy(path: str, request: Request):
    return await proxy_request("dashboard", f"/{path}", request)


# Monitor routes
@app.api_route("/monitor/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def monitor_proxy(path: str, request: Request):
    return await proxy_request("monitor", f"/{path}", request)


# Notify routes
@app.api_route("/notify/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def notify_proxy(path: str, request: Request):
    return await proxy_request("notify", f"/{path}", request)


# Status routes (public)
@app.api_route("/status/{path:path}", methods=["GET", "POST"])
async def status_proxy(path: str, request: Request):
    return await proxy_request("status", f"/{path}", request)


# Events (SSE passthrough)
@app.get("/events/{org_slug}")
async def events_proxy(org_slug: str, request: Request):
    return await proxy_request("status", f"/events/{org_slug}", request)
