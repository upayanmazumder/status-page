"""Prometheus metrics utilities for Status Page services."""
import time
from functools import wraps
from typing import Callable, Optional

from prometheus_client import Counter, Histogram, Info, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Service info
SERVICE_INFO = Info("statuspage_service", "Service metadata")

# HTTP request metrics
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Service-specific metrics
DB_QUERIES_TOTAL = Counter(
    "db_queries_total",
    "Total database queries",
    ["operation"],
)

DB_QUERY_DURATION = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

CACHE_OPERATIONS_TOTAL = Counter(
    "cache_operations_total",
    "Total cache operations",
    ["operation", "result"],
)

WEBHOOK_DELIVERIES_TOTAL = Counter(
    "webhook_deliveries_total",
    "Total webhook delivery attempts",
    ["status"],
)

MONITOR_CHECKS_TOTAL = Counter(
    "monitor_checks_total",
    "Total monitor checks executed",
    ["result"],
)


def record_http_request(method: str, endpoint: str, status_code: int, duration: float) -> None:
    """Record HTTP request metrics."""
    HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
    HTTP_REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)


def record_db_query(operation: str, duration: float) -> None:
    """Record database query metrics."""
    DB_QUERIES_TOTAL.labels(operation=operation).inc()
    DB_QUERY_DURATION.labels(operation=operation).observe(duration)


def record_cache_operation(operation: str, success: bool) -> None:
    """Record cache operation metrics."""
    result = "hit" if success else "miss"
    CACHE_OPERATIONS_TOTAL.labels(operation=operation, result=result).inc()


def get_metrics_response() -> Response:
    """Generate Prometheus metrics HTTP response."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


def setup_metrics(app, service_name: str, service_version: str = "1.0.0"):
    """Setup metrics for a FastAPI app with middleware."""
    SERVICE_INFO.info({"name": service_name, "version": service_version})

    @app.middleware("http")
    async def metrics_middleware(request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        
        method = request.method
        endpoint = request.url.path
        status_code = response.status_code
        
        record_http_request(method, endpoint, status_code, duration)
        return response

    @app.get("/metrics")
    async def metrics_endpoint():
        return get_metrics_response()
