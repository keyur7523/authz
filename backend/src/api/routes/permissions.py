from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.permission import PermissionCreateIn, PermissionUpdateIn, PermissionOut
from src.services.rbac_service import RBACService
from src.services.org_service import OrgService
from src.services.audit_service import AuditService
from src.db.database import get_db
from src.db.models.user import User
from src.api.dependencies import get_current_user, check_org_admin
from src.core.exceptions import NotFound, Forbidden

router = APIRouter(tags=["permissions"])


@router.post("/orgs/{org_id}/permissions", response_model=PermissionOut)
async def create_permission(
    org_id: UUID,
    payload: PermissionCreateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_org_admin(OrgService(db), org_id, current_user.id)
    permission = await RBACService(db).create_permission(org_id, payload)
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="permission.created",
        resource_type="permission",
        resource_id=str(permission.id),
        details={"name": permission.name},
        request=request,
    )

    return PermissionOut(
        id=str(permission.id),
        org_id=str(permission.org_id),
        name=permission.name,
        description=permission.description,
        created_at=permission.created_at,
    )


@router.get("/orgs/{org_id}/permissions", response_model=list[PermissionOut])
async def list_permissions(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    permissions = await RBACService(db).list_permissions(org_id)
    return [
        PermissionOut(
            id=str(p.id),
            org_id=str(p.org_id),
            name=p.name,
            description=p.description,
            created_at=p.created_at,
        )
        for p in permissions
    ]


@router.put("/orgs/{org_id}/permissions/{permission_id}", response_model=PermissionOut)
async def update_permission(
    org_id: UUID,
    permission_id: UUID,
    payload: PermissionUpdateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    permission = await service.get_permission(permission_id)
    if not permission or permission.org_id != org_id:
        raise NotFound("Permission not found")

    permission = await service.update_permission(permission_id, payload)
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="permission.updated",
        resource_type="permission",
        resource_id=str(permission_id),
        details=payload.model_dump(mode="json", exclude_none=True),
        request=request,
    )

    return PermissionOut(
        id=str(permission.id),
        org_id=str(permission.org_id),
        name=permission.name,
        description=permission.description,
        created_at=permission.created_at,
    )


@router.delete("/orgs/{org_id}/permissions/{permission_id}", status_code=204)
async def delete_permission(
    org_id: UUID,
    permission_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_org_admin(OrgService(db), org_id, current_user.id)

    service = RBACService(db)
    permission = await service.get_permission(permission_id)
    if not permission or permission.org_id != org_id:
        raise NotFound("Permission not found")

    await service.delete_permission(permission_id)
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="permission.deleted",
        resource_type="permission",
        resource_id=str(permission_id),
        details={"name": permission.name},
        request=request,
    )
