"""Tests for JWT module."""
import time
from datetime import datetime, timezone

import pytest

from shared.jwt import JWTManager
from shared.errors import AuthenticationError


class TestJWTManager:
    def test_create_access_token(self):
        token = JWTManager.create_access_token("user_123")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_org_and_role(self):
        token = JWTManager.create_access_token(
            subject="user_123",
            org_id="org_456",
            role="admin",
            extra_claims={"name": "Test User"},
        )
        payload = JWTManager.decode_access_token(token)
        assert payload["sub"] == "user_123"
        assert payload["org_id"] == "org_456"
        assert payload["role"] == "admin"
        assert payload["name"] == "Test User"
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        token = JWTManager.create_refresh_token("user_123")
        payload = JWTManager.decode_refresh_token(token)
        assert payload["sub"] == "user_123"
        assert payload["type"] == "refresh"

    def test_decode_invalid_token(self):
        with pytest.raises(AuthenticationError):
            JWTManager.decode_access_token("invalid.token.here")

    def test_decode_expired_token(self):
        from jose import jwt as jose_jwt
        from shared.config import get_settings

        settings = get_settings()
        expired_payload = {
            "sub": "user_123",
            "exp": datetime.now(timezone.utc),
            "type": "access",
        }
        expired_token = jose_jwt.encode(
            expired_payload,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )

        with pytest.raises(AuthenticationError):
            JWTManager.decode_access_token(expired_token)

    def test_decode_wrong_token_type(self):
        refresh_token = JWTManager.create_refresh_token("user_123")
        with pytest.raises(AuthenticationError, match="Invalid token type"):
            JWTManager.decode_access_token(refresh_token)

    def test_get_token_expiry(self):
        token = JWTManager.create_access_token("user_123")
        expiry = JWTManager.get_token_expiry(token)
        assert isinstance(expiry, datetime)
        assert expiry > datetime.now(timezone.utc)
