from uuid import UUID
from fastapi import Depends, Header, Path
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole, OrgMembership
from src.core.exceptions import Unauthorized, Forbidden, NotFound
from src.core.security import decode_token
from src.services.auth_service import AuthService
from src.services.org_service import OrgService


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthorized("Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except Exception:
        raise Unauthorized("Invalid token")

    if payload.get("type") != "access":
        raise Unauthorized("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise Unauthorized("Invalid token")

    user = await AuthService(db).get_user(user_id)
    if not user:
        raise Unauthorized("User not found")

    if not user.is_active:
        raise Unauthorized("User account is disabled")

    return user


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get the current user if authenticated, otherwise None."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except Exception:
        return None

    if payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    return await AuthService(db).get_user(user_id)


class OrgMembershipChecker:
    """Dependency to check organization membership."""

    def __init__(self, required_roles: list[OrgMemberRole] | None = None):
        self.required_roles = required_roles

    async def __call__(
        self,
        org_id: UUID = Path(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> OrgMembership:
        membership = await OrgService(db).get_membership(org_id, current_user.id)
        if not membership:
            raise Forbidden("Not a member of this organization")

        if self.required_roles and membership.role not in self.required_roles:
            raise Forbidden("Insufficient permissions")

        return membership


# Commonly used dependency instances
require_org_member = OrgMembershipChecker()
require_org_admin = OrgMembershipChecker([OrgMemberRole.OWNER, OrgMemberRole.ADMIN])
require_org_owner = OrgMembershipChecker([OrgMemberRole.OWNER])
