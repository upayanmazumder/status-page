"""Tests for error handling."""
import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient

from shared.errors import (
    StatusPageError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    setup_error_handlers,
)


class TestStatusPageError:
    def test_basic_error(self):
        error = StatusPageError("Something went wrong", 500)
        assert error.message == "Something went wrong"
        assert error.status_code == 500
        assert error.details == {}

    def test_error_with_details(self):
        error = StatusPageError("Validation failed", 422, {"field": "name"})
        assert error.details == {"field": "name"}

    def test_authentication_error(self):
        error = AuthenticationError("Invalid credentials")
        assert error.status_code == 401
        assert error.message == "Invalid credentials"

    def test_authorization_error(self):
        error = AuthorizationError()
        assert error.status_code == 403
        assert error.message == "Insufficient permissions"

    def test_not_found_error(self):
        error = NotFoundError("User not found")
        assert error.status_code == 404

    def test_validation_error(self):
        error = ValidationError("Invalid email")
        assert error.status_code == 422


class TestErrorHandlers:
    @pytest.fixture
    def app(self):
        app = FastAPI()
        setup_error_handlers(app)

        @app.get("/auth-error")
        def auth_error():
            raise AuthenticationError("Test auth error")

        @app.get("/not-found")
        def not_found():
            raise NotFoundError("Test not found")

        @app.get("/generic")
        def generic():
            raise ValueError("Unexpected error")

        return app

    @pytest.fixture
    def client(self, app):
        return TestClient(app)

    def test_auth_error_handler(self, client):
        response = client.get("/auth-error")
        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "AuthenticationError"
        assert data["message"] == "Test auth error"

    def test_not_found_handler(self, client):
        response = client.get("/not-found")
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NotFoundError"

    def test_generic_error_handler(self, client):
        response = client.get("/generic")
        assert response.status_code == 500
        data = response.json()
        assert data["error"] == "InternalServerError"
