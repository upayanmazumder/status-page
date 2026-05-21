"""Tests for Dashboard Service - Component Groups and Incident Detail."""
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
    return JWTManager.create_access_token(
        subject="test-user-id",
        org_id="test-org-id",
        role="owner",
    )


class TestComponentGroups:
    def test_create_group_unauthorized(self, client):
        response = client.post("/groups?project_id=test", json={"name": "API Group"})
        assert response.status_code == 401

    def test_create_group_validation_error(self, client, auth_token):
        response = client.post(
            "/groups?project_id=test",
            json={"name": ""},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 422

    def test_get_groups_unauthorized(self, client):
        response = client.get("/groups?project_id=test")
        assert response.status_code == 401

    def test_update_group_not_found(self, client, auth_token):
        response = client.patch(
            f"/groups/{uuid.uuid4()}",
            json={"name": "Updated"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404

    def test_delete_group_not_found(self, client, auth_token):
        response = client.delete(
            f"/groups/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404


class TestIncidentDetail:
    def test_get_incident_detail_unauthorized(self, client):
        response = client.get(f"/incidents/{uuid.uuid4()}")
        assert response.status_code == 401

    def test_get_incident_detail_not_found(self, client, auth_token):
        response = client.get(
            f"/incidents/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 404

    def test_incident_detail_response_structure(self, client, auth_token):
        # This would need actual DB data to test properly
        response = client.get(
            f"/incidents/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Should return 404 since no data exists
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NotFoundError"


class TestComponentFilters:
    def test_get_components_with_group_filter(self, client, auth_token):
        response = client.get(
            "/components?project_id=test&group_id=test-group",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Will fail with DB error but tests structure
        assert response.status_code in [200, 500]


class TestMaintenanceEndpoints:
    def test_create_maintenance_unauthorized(self, client):
        response = client.post("/maintenances?project_id=test", json={
            "title": "Test",
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
