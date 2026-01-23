from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.role import RoleAssignIn, UserRoleOut
from src.schemas.permission import UserPermissionsOut
from src.services.rbac_service import RBACService
from src.services.org_service import OrgService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.api.dependencies import get_current_user
from src.core.exceptions import Forbidden

router = APIRouter(tags=["users"])


async def _check_org_admin(service: OrgService, org_id: UUID, user_id: UUID):
    membership = await service.get_membership(org_id, user_id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")
    return membership


@router.post("/orgs/{org_id}/users/{user_id}/roles", response_model=UserRoleOut)
async def assign_role(
    org_id: UUID,
    user_id: UUID,
    payload: RoleAssignIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    user_role = await RBACService(db).assign_role_to_user(
        org_id=org_id,
        user_id=user_id,
        role_id=UUID(payload.role_id),
        assigned_by=current_user.id,
    )
    return UserRoleOut(
        id=str(user_role.id),
        user_id=str(user_role.user_id),
        role_id=str(user_role.role_id),
        org_id=str(user_role.org_id),
        assigned_by=str(user_role.assigned_by) if user_role.assigned_by else None,
        assigned_at=user_role.assigned_at,
    )


@router.delete("/orgs/{org_id}/users/{user_id}/roles/{role_id}", status_code=204)
async def revoke_role(
    org_id: UUID,
    user_id: UUID,
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)
    await RBACService(db).revoke_role_from_user(org_id, user_id, role_id)


@router.get("/orgs/{org_id}/users/{user_id}/permissions", response_model=UserPermissionsOut)
async def get_user_permissions(
    org_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    permissions = await RBACService(db).get_user_permissions(org_id, user_id)
    return UserPermissionsOut(
        user_id=str(user_id),
        org_id=str(org_id),
        permissions=permissions,
    )


@router.get("/orgs/{org_id}/users/{user_id}/roles", response_model=list[UserRoleOut])
async def get_user_roles(
    org_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    user_roles = await RBACService(db).get_user_roles(org_id, user_id)
    return [
        UserRoleOut(
            id=str(ur.id),
            user_id=str(ur.user_id),
            role_id=str(ur.role_id),
            org_id=str(ur.org_id),
            assigned_by=str(ur.assigned_by) if ur.assigned_by else None,
            assigned_at=ur.assigned_at,
        )
        for ur in user_roles
    ]
