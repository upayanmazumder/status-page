"""Tests for shared configuration module."""
import os

import pytest

from shared.config import Settings, get_settings


class TestSettings:
    def test_default_settings(self):
        settings = Settings()
        assert settings.environment == "development"
        assert settings.log_level == "INFO"
        assert settings.debug is False
        assert settings.jwt_algorithm == "HS256"

    def test_cors_origins_parsing(self):
        settings = Settings(cors_origins="http://localhost:3000,https://example.com")
        origins = settings.get_cors_origins()
        assert origins == ["http://localhost:3000", "https://example.com"]

    def test_single_cors_origin(self):
        settings = Settings(cors_origins="http://localhost:3000")
        origins = settings.get_cors_origins()
        assert origins == ["http://localhost:3000"]

    def test_settings_from_env(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        monkeypatch.setenv("JWT_SECRET", "test-secret")

        settings = Settings()
        assert settings.environment == "production"
        assert settings.log_level == "DEBUG"
        assert settings.jwt_secret == "test-secret"


class TestGetSettings:
    def test_cached_instance(self):
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2
