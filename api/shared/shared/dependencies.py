"""FastAPI dependencies shared across services."""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_async_session
from shared.redis import get_redis
from shared.jwt import JWTManager
from shared.errors import AuthenticationError, AuthorizationError
from shared.logging import get_logger

logger = get_logger(__name__)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Extract and validate JWT token from Authorization header."""
    if not credentials:
        raise AuthenticationError("Authentication required")

    token = credentials.credentials
    try:
        payload = JWTManager.decode_access_token(token)
        return payload
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error("token_validation_failed", error=str(e))
        raise AuthenticationError("Invalid token")


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Extract user from token if present, otherwise return None."""
    if not credentials:
        return None
    try:
        return JWTManager.decode_access_token(credentials.credentials)
    except Exception:
        return None


async def require_org_access(
    user: dict = Depends(get_current_user),
    org_id: Optional[str] = None,
) -> dict:
    """Verify user has access to the specified organization."""
    user_org_id = user.get("org_id")
    user_role = user.get("role")

    if not user_org_id:
        raise AuthenticationError("Token missing org_id")

    if org_id and user_org_id != org_id:
        raise AuthorizationError("Access denied for this organization")

    return user


async def require_role(required_role: str):
    """Factory for role-based access control dependency."""
    async def check_role(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "member")
        role_hierarchy = {"member": 1, "admin": 2, "owner": 3}

        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
            raise AuthorizationError(f"Role '{required_role}' or higher required")
        return user
    return check_role


# Convenience exports
db_dependency = Depends(get_async_session)
redis_dependency = Depends(get_redis)
user_dependency = Depends(get_current_user)
optional_user_dependency = Depends(get_current_user_optional)
