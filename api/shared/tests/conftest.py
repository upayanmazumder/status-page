"""Shared pytest fixtures and configuration."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from shared.config import Settings, get_settings
from shared.errors import setup_error_handlers


@pytest.fixture(autouse=True)
def reset_settings_cache():
    """Clear settings cache before each test."""
    get_settings.cache_clear()
    yield


@pytest.fixture
def app():
    """Create a test FastAPI application."""
    app = FastAPI()
    setup_error_handlers(app)
    return app


@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def test_settings():
    """Return test-specific settings."""
    return Settings(
        environment="testing",
        database_url="postgresql+asyncpg://test:test@localhost:5432/test",
        jwt_secret="test-jwt-secret-key-for-testing-only",
        jwt_refresh_secret="test-refresh-secret-key-for-testing-only",
        redis_url="redis://localhost:6379/1",
    )
