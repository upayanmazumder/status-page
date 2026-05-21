"""Tests for Gateway Service."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app, check_rate_limit


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    @patch("httpx.AsyncClient.get")
    def test_health_all_healthy(self, mock_get, client):
        mock_get.return_value = AsyncMock(status_code=200)
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "gateway"
        assert "details" in data

    @patch("httpx.AsyncClient.get")
    def test_health_service_unavailable(self, mock_get, client):
        mock_get.side_effect = Exception("Connection refused")
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"


class TestAuthProxy:
    def test_auth_proxy_no_auth_required(self, client):
        # Auth endpoints should be publicly accessible
        response = client.get("/auth/health")
        # Will fail because no auth service is running, but tests routing
        assert response.status_code in [200, 503]


class TestRateLimit:
    @patch("app.main.get_redis")
    def test_rate_limit(self, mock_get_redis, client):
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "101"  # Exceeded limit
        mock_get_redis.return_value = mock_redis

        response = client.get("/dashboard/test")
        assert response.status_code == 429


class TestProtectedRoutes:
    def test_dashboard_requires_auth(self, client):
        response = client.get("/dashboard/components")
        assert response.status_code == 401

    def test_monitor_requires_auth(self, client):
        response = client.get("/monitor/checks")
        assert response.status_code == 401

    def test_notify_requires_auth(self, client):
        response = client.get("/notify/subscribers")
        assert response.status_code == 401


class TestPublicRoutes:
    def test_status_public(self, client):
        response = client.get("/status/test-org/default")
        assert response.status_code in [200, 404, 503]


class TestRequestLogging:
    @patch("app.main.logger")
    def test_request_logging(self, mock_logger, client):
        response = client.get("/health")
        assert response.status_code in [200, 503]
        mock_logger.info.assert_called()
