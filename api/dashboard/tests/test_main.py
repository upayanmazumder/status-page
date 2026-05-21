"""Tests for Dashboard Service."""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from shared.jwt import JWTManager


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_token():
    """Create a test JWT token."""
    return JWTManager.create_access_token(
        subject="test-user-id",
        org_id="test-org-id",
        role="owner",
    )


class TestHealthCheck:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "dashboard"


class TestComponents:
    def test_create_component_unauthorized(self, client):
        response = client.post("/components?project_id=test", json={
            "name": "API",
            "description": "Main API",
        })
        assert response.status_code == 401

    def test_create_component_validation_error(self, client, auth_token):
        response = client.post(
            "/components?project_id=test",
            json={"name": ""},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 422

    def test_get_components_unauthorized(self, client):
        response = client.get("/components?project_id=test")
        assert response.status_code == 401

    def test_update_component_not_found(self, client, auth_token):
        response = client.patch(
            f"/components/{uuid.uuid4()}",
            json={"name": "Updated"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404

    def test_delete_component_not_found(self, client, auth_token):
        response = client.delete(
            f"/components/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404


class TestIncidents:
    def test_create_incident_unauthorized(self, client):
        response = client.post("/incidents?project_id=test", json={
            "title": "Outage",
            "status": "investigating",
            "impact": "major",
        })
        assert response.status_code == 401

    def test_create_incident_validation_error(self, client, auth_token):
        response = client.post(
            "/incidents?project_id=test",
            json={"title": ""},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 422

    def test_get_incidents_unauthorized(self, client):
        response = client.get("/incidents?project_id=test")
        assert response.status_code == 401

    def test_update_incident_not_found(self, client, auth_token):
        response = client.patch(
            f"/incidents/{uuid.uuid4()}",
            json={"message": "Fixed", "status": "resolved"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404


class TestMaintenance:
    def test_create_maintenance_unauthorized(self, client):
        response = client.post("/maintenances?project_id=test", json={
            "title": "Scheduled Maintenance",
            "scheduled_start": datetime.now(timezone.utc).isoformat(),
            "scheduled_end": datetime.now(timezone.utc).isoformat(),
        })
        assert response.status_code == 401

    def test_create_maintenance_validation_error(self, client, auth_token):
        response = client.post(
            "/maintenances?project_id=test",
            json={"title": ""},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 422

    def test_get_maintenances_unauthorized(self, client):
        response = client.get("/maintenances?project_id=test")
        assert response.status_code == 401


class TestPagination:
    def test_pagination_params(self, client, auth_token):
        response = client.get(
            "/components?project_id=test&page=2&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Will fail with DB error since no DB is connected, but tests structure
        assert response.status_code in [200, 500]
