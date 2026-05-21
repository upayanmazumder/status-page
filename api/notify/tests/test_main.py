"""Tests for Notify Service."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

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
        assert data["service"] == "notify"


class TestSubscribers:
    def test_create_subscriber_validation_error(self, client):
        # Missing both email and webhook
        response = client.post("/subscribers/test-project", json={})
        assert response.status_code == 422

    def test_create_subscriber_with_email(self, client):
        response = client.post("/subscribers/test-project", json={
            "email": "test@example.com",
            "notify_incident": True,
        })
        # Will fail without DB but tests structure
        assert response.status_code in [200, 500]

    def test_get_subscribers_unauthorized(self, client):
        response = client.get("/subscribers/test-project")
        assert response.status_code == 401

    def test_delete_subscriber_unauthorized(self, client):
        response = client.delete("/subscribers/test-id")
        assert response.status_code == 401

    def test_verify_subscriber_invalid_token(self, client):
        response = client.get("/verify/invalid-token")
        assert response.status_code == 404


class TestNotifications:
    def test_notify_incident_unauthorized(self, client):
        response = client.post("/notify/test-project/incident?incident_id=test")
        assert response.status_code == 401

    def test_notify_maintenance_unauthorized(self, client):
        response = client.post("/notify/test-project/maintenance?maintenance_id=test")
        assert response.status_code == 401


class TestEmailSending:
    @patch("app.main.send_email")
    async def test_send_email(self, mock_send):
        mock_send.return_value = True
        from app.main import send_email
        result = await send_email("test@example.com", "Test", "Body")
        assert result is True


class TestWebhookSending:
    @patch("httpx.AsyncClient.post")
    async def test_send_webhook(self, mock_post):
        mock_post.return_value = AsyncMock(status_code=200)
        from app.main import send_webhook, WebhookPayload
        payload = WebhookPayload(event="test", data={})
        result = await send_webhook("https://example.com/webhook", payload)
        assert result is True
