from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.role import RoleAssignIn, UserRoleOut
from src.schemas.permission import UserPermissionsOut
from src.services.rbac_service import RBACService
from src.services.org_service import OrgService
from src.services.audit_service import AuditService
from src.db.database import get_db
from src.db.models.user import User
from src.api.dependencies import get_current_user, check_org_admin
from src.core.exceptions import Forbidden

router = APIRouter(tags=["users"])


@router.post("/orgs/{org_id}/users/{user_id}/roles", response_model=UserRoleOut)
async def assign_role(
    org_id: UUID,
    user_id: UUID,
    payload: RoleAssignIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_org_admin(OrgService(db), org_id, current_user.id)

    user_role = await RBACService(db).assign_role_to_user(
        org_id=org_id,
        user_id=user_id,
        role_id=UUID(payload.role_id),
        assigned_by=current_user.id,
    )
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="role.assigned",
        resource_type="user",
        resource_id=str(user_id),
        details={"role_id": payload.role_id},
        request=request,
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
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_org_admin(OrgService(db), org_id, current_user.id)
    await RBACService(db).revoke_role_from_user(org_id, user_id, role_id)
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="role.revoked",
        resource_type="user",
        resource_id=str(user_id),
        details={"role_id": str(role_id)},
        request=request,
    )


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
