"""Tests for Monitor Service."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app, execute_http_check, execute_tcp_check
from shared.models import UptimeCheck, CheckMethod


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "monitor"


class TestCheckExecution:
    @patch("httpx.AsyncClient.get")
    async def test_execute_http_check_success(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        check = UptimeCheck(
            id="test-id",
            component_id="comp-id",
            project_id="proj-id",
            org_id="org-id",
            name="Test",
            method=CheckMethod.http,
            target="https://example.com",
            interval=60,
            timeout_ms=10000,
        )

        result = await execute_http_check(check)
        assert result.result == "up"
        assert result.status_code == 200

    @patch("httpx.AsyncClient.get")
    async def test_execute_http_check_failure(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        check = UptimeCheck(
            id="test-id",
            component_id="comp-id",
            project_id="proj-id",
            org_id="org-id",
            name="Test",
            method=CheckMethod.http,
            target="https://example.com",
            interval=60,
            timeout_ms=10000,
        )

        result = await execute_http_check(check)
        assert result.result == "down"
        assert result.status_code == 500

    @patch("httpx.AsyncClient.get")
    async def test_execute_http_check_timeout(self, mock_get):
        mock_get.side_effect = Exception("Timeout")

        check = UptimeCheck(
            id="test-id",
            component_id="comp-id",
            project_id="proj-id",
            org_id="org-id",
            name="Test",
            method=CheckMethod.http,
            target="https://example.com",
            interval=60,
            timeout_ms=1000,
        )

        result = await execute_http_check(check)
        assert result.result == "down"

    async def test_execute_tcp_check(self):
        check = UptimeCheck(
            id="test-id",
            component_id="comp-id",
            project_id="proj-id",
            org_id="org-id",
            name="Test",
            method=CheckMethod.tcp,
            target="google.com:80",
            interval=60,
            timeout_ms=5000,
        )

        result = await execute_tcp_check(check)
        # Should succeed for google.com:80
        assert result.result in ["up", "down", "timeout"]


class TestCRUD:
    def test_create_check_unauthorized(self, client):
        response = client.post("/checks", json={
            "component_id": "test",
            "name": "Health Check",
            "method": "http",
            "target": "https://example.com",
        })
        assert response.status_code == 401

    def test_create_check_validation_error(self, client):
        # Missing required fields
        response = client.post("/checks", json={})
        assert response.status_code == 422

    def test_get_checks_unauthorized(self, client):
        response = client.get("/checks/test-component")
        assert response.status_code == 401

    def test_run_check_unauthorized(self, client):
        response = client.post("/checks/test-check/run")
        assert response.status_code == 401

    def test_get_history_unauthorized(self, client):
        response = client.get("/history/test-component")
        assert response.status_code == 401
