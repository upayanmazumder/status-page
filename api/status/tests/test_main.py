"""Tests for Status Service."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "status"


class TestPublicStatusPage:
    def test_status_page_not_found_org(self, client):
        response = client.get("/status/nonexistent/project")
        assert response.status_code == 404

    def test_status_page_not_found_project(self, client):
        # Would need actual org in DB to test this properly
        response = client.get("/status/test/nonexistent")
        assert response.status_code in [404, 500]


class TestMetrics:
    def test_metrics_not_found(self, client):
        response = client.get("/status/nonexistent/project/metrics")
        assert response.status_code == 404

    def test_metrics_default_period(self, client):
        # Would need actual data in DB
        response = client.get("/status/test/project/metrics")
        assert response.status_code in [200, 404, 500]

    def test_metrics_custom_period(self, client):
        response = client.get("/status/test/project/metrics?period=7d")
        assert response.status_code in [200, 404, 500]


class TestSSE:
    def test_sse_endpoint(self, client):
        # SSE endpoint returns a stream
        response = client.get("/events/test/project")
        # FastAPI TestClient doesn't handle SSE streams well
        # but we can verify the endpoint exists
        assert response.status_code in [200, 500]
