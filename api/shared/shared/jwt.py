"""JWT token management."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from shared.config import get_settings
from shared.errors import AuthenticationError


class JWTManager:
    """Handles JWT token creation and validation."""

    @staticmethod
    def create_access_token(
        subject: str,
        org_id: Optional[str] = None,
        role: Optional[str] = None,
        extra_claims: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a new access token."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        expires = now + timedelta(seconds=settings.jwt_expires_in)

        payload = {
            "sub": subject,
            "iat": now,
            "exp": expires,
            "type": "access",
        }

        if org_id:
            payload["org_id"] = org_id
        if role:
            payload["role"] = role
        if extra_claims:
            payload.update(extra_claims)

        return jwt.encode(
            payload,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )

    @staticmethod
    def create_refresh_token(subject: str) -> str:
        """Create a new refresh token."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        expires = now + timedelta(seconds=settings.jwt_refresh_expires_in)

        payload = {
            "sub": subject,
            "iat": now,
            "exp": expires,
            "type": "refresh",
        }

        return jwt.encode(
            payload,
            settings.jwt_refresh_secret,
            algorithm=settings.jwt_algorithm,
        )

    @staticmethod
    def decode_access_token(token: str) -> Dict[str, Any]:
        """Decode and validate an access token."""
        settings = get_settings()
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
            if payload.get("type") != "access":
                raise AuthenticationError("Invalid token type")
            return payload
        except JWTError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")

    @staticmethod
    def decode_refresh_token(token: str) -> Dict[str, Any]:
        """Decode and validate a refresh token."""
        settings = get_settings()
        try:
            payload = jwt.decode(
                token,
                settings.jwt_refresh_secret,
                algorithms=[settings.jwt_algorithm],
            )
            if payload.get("type") != "refresh":
                raise AuthenticationError("Invalid token type")
            return payload
        except JWTError as e:
            raise AuthenticationError(f"Invalid refresh token: {str(e)}")

    @staticmethod
    def get_token_expiry(token: str) -> datetime:
        """Get token expiration time without full validation."""
        payload = jwt.get_unverified_claims(token)
        exp = payload.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc)
        raise AuthenticationError("Token has no expiration")
