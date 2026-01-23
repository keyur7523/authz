from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.role import (
    RoleCreateIn,
    RoleUpdateIn,
    RoleOut,
    RoleWithPermissions,
    AddPermissionsIn,
)
from src.services.rbac_service import RBACService
from src.services.org_service import OrgService
from src.services.audit_service import AuditService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.api.dependencies import get_current_user
from src.core.exceptions import NotFound, Forbidden

router = APIRouter(tags=["roles"])


async def _check_org_admin(service: OrgService, org_id: UUID, user_id: UUID):
    membership = await service.get_membership(org_id, user_id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")
    return membership


@router.post("/orgs/{org_id}/roles", response_model=RoleOut)
async def create_role(
    org_id: UUID,
    payload: RoleCreateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)
    role = await RBACService(db).create_role(org_id, payload)

    # Audit log
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="role.created",
        resource_type="role",
        resource_id=str(role.id),
        details={"name": role.name},
        request=request,
    )

    return RoleOut(
        id=str(role.id),
        org_id=str(role.org_id),
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.get("/orgs/{org_id}/roles", response_model=list[RoleWithPermissions])
async def list_roles(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    roles = await RBACService(db).list_roles(org_id)
    return [
        RoleWithPermissions(
            id=str(role.id),
            org_id=str(role.org_id),
            name=role.name,
            description=role.description,
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at,
            permissions=[
                {
                    "id": str(rp.permission.id),
                    "name": rp.permission.name,
                    "description": rp.permission.description,
                }
                for rp in role.permissions
            ],
        )
        for role in roles
    ]


@router.get("/orgs/{org_id}/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    org_id: UUID,
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    role = await RBACService(db).get_role(role_id)
    if not role or role.org_id != org_id:
        raise NotFound("Role not found")

    return RoleWithPermissions(
        id=str(role.id),
        org_id=str(role.org_id),
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        created_at=role.created_at,
        updated_at=role.updated_at,
        permissions=[
            {
                "id": str(rp.permission.id),
                "name": rp.permission.name,
                "description": rp.permission.description,
            }
            for rp in role.permissions
        ],
    )


@router.put("/orgs/{org_id}/roles/{role_id}", response_model=RoleOut)
async def update_role(
    org_id: UUID,
    role_id: UUID,
    payload: RoleUpdateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    role = await service.get_role(role_id)
    if not role or role.org_id != org_id:
        raise NotFound("Role not found")

    role = await service.update_role(role_id, payload)

    # Audit log
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="role.updated",
        resource_type="role",
        resource_id=str(role_id),
        details=payload.model_dump(exclude_none=True),
        request=request,
    )

    return RoleOut(
        id=str(role.id),
        org_id=str(role.org_id),
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.delete("/orgs/{org_id}/roles/{role_id}", status_code=204)
async def delete_role(
    org_id: UUID,
    role_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    role = await service.get_role(role_id)
    if not role or role.org_id != org_id:
        raise NotFound("Role not found")

    # Audit log before deletion
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="role.deleted",
        resource_type="role",
        resource_id=str(role_id),
        details={"name": role.name},
        request=request,
    )

    await service.delete_role(role_id)


@router.post("/orgs/{org_id}/roles/{role_id}/permissions", status_code=204)
async def add_permissions_to_role(
    org_id: UUID,
    role_id: UUID,
    payload: AddPermissionsIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    role = await service.get_role(role_id)
    if not role or role.org_id != org_id:
        raise NotFound("Role not found")

    permission_ids = [UUID(pid) for pid in payload.permission_ids]
    await service.add_permissions_to_role(role_id, permission_ids)


@router.delete("/orgs/{org_id}/roles/{role_id}/permissions/{permission_id}", status_code=204)
async def remove_permission_from_role(
    org_id: UUID,
    role_id: UUID,
    permission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    role = await service.get_role(role_id)
    if not role or role.org_id != org_id:
        raise NotFound("Role not found")

    await service.remove_permission_from_role(role_id, permission_id)
