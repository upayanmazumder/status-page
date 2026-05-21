"""Tests for Auth Service."""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app, hash_password, verify_password
from shared import setup_error_handlers
from shared.database import DatabaseManager, get_async_session
from shared.models import User, Organization, OrgMembership


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthCheck:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "auth"


class TestPasswordUtils:
    def test_hash_password(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert hashed != password
        assert hashed.startswith("$2")

    def test_verify_password(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False


class TestRegistration:
    def test_register_success(self, client):
        response = client.post("/register", json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "test-org",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    def test_register_duplicate_email(self, client):
        # First registration
        client.post("/register", json={
            "email": "dup@example.com",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "test-org-1",
        })

        # Duplicate email
        response = client.post("/register", json={
            "email": "dup@example.com",
            "password": "password123",
            "name": "Test User 2",
            "org_name": "Test Org 2",
            "org_slug": "test-org-2",
        })
        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "ConflictError"

    def test_register_duplicate_slug(self, client):
        # First registration
        client.post("/register", json={
            "email": "slug1@example.com",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "same-slug",
        })

        # Duplicate slug
        response = client.post("/register", json={
            "email": "slug2@example.com",
            "password": "password123",
            "name": "Test User 2",
            "org_name": "Test Org 2",
            "org_slug": "same-slug",
        })
        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "ConflictError"

    def test_register_invalid_email(self, client):
        response = client.post("/register", json={
            "email": "not-an-email",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "test-org",
        })
        assert response.status_code == 422

    def test_register_short_password(self, client):
        response = client.post("/register", json={
            "email": "test@example.com",
            "password": "short",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "test-org",
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        # Register first
        reg_response = client.post("/register", json={
            "email": "login@example.com",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "login-test",
        })
        assert reg_response.status_code == 200

        # Login
        response = client.post("/login", json={
            "email": "login@example.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_invalid_email(self, client):
        response = client.post("/login", json={
            "email": "nonexistent@example.com",
            "password": "password123",
        })
        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "AuthenticationError"

    def test_login_invalid_password(self, client):
        # Register first
        client.post("/register", json={
            "email": "wrongpass@example.com",
            "password": "password123",
            "name": "Test User",
            "org_name": "Test Org",
            "org_slug": "wrongpass-test",
        })

        # Login with wrong password
        response = client.post("/login", json={
            "email": "wrongpass@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401


class TestMe:
    def test_get_me(self, client):
        # Register and get token
        reg_response = client.post("/register", json={
            "email": "me@example.com",
            "password": "password123",
            "name": "Me User",
            "org_name": "Me Org",
            "org_slug": "me-test",
        })
        token = reg_response.json()["access_token"]

        # Get current user
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "me@example.com"
        assert data["user"]["name"] == "Me User"
        assert data["org_id"] is not None
        assert data["role"] == "owner"

    def test_get_me_no_token(self, client):
        response = client.get("/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get("/me", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401


class TestRefreshToken:
    def test_refresh_token(self, client):
        # Register and get tokens
        reg_response = client.post("/register", json={
            "email": "refresh@example.com",
            "password": "password123",
            "name": "Refresh User",
            "org_name": "Refresh Org",
            "org_slug": "refresh-test",
        })
        refresh_token = reg_response.json()["refresh_token"]

        # Refresh
        response = client.post("/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_no_token(self, client):
        response = client.post("/refresh", json={})
        assert response.status_code == 422
