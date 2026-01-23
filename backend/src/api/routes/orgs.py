from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.organization import (
    OrgCreateIn,
    OrgUpdateIn,
    OrgOut,
    OrgDetailOut,
    OrgMemberOut,
    InviteCreateIn,
    InviteOut,
    InviteAcceptIn,
)
from src.services.org_service import OrgService
from src.services.audit_service import AuditService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.api.dependencies import get_current_user
from src.core.exceptions import NotFound, Forbidden

router = APIRouter(prefix="/orgs", tags=["orgs"])


@router.post("", response_model=OrgOut)
async def create_org(
    payload: OrgCreateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org, membership = await OrgService(db).create_org(current_user.id, payload)

    # Audit log
    await AuditService(db).log(
        org_id=org.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="org.created",
        resource_type="organization",
        resource_id=str(org.id),
        details={"name": org.name, "slug": org.slug},
        request=request,
    )

    return OrgOut(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        role=membership.role.value,
    )


@router.get("", response_model=list[OrgOut])
async def list_orgs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orgs = await OrgService(db).list_orgs(current_user.id)
    return [
        OrgOut(id=str(org.id), name=org.name, slug=org.slug, role=role.value)
        for org, role in orgs
    ]


@router.get("/{org_id}", response_model=OrgDetailOut)
async def get_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    org = await service.get_org(org_id)
    if not org:
        raise NotFound("Organization not found")

    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    return OrgDetailOut(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


@router.put("/{org_id}", response_model=OrgDetailOut)
async def update_org(
    org_id: UUID,
    payload: OrgUpdateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")

    org = await service.update_org(org_id, payload)

    # Audit log
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="org.updated",
        resource_type="organization",
        resource_id=str(org_id),
        details=payload.model_dump(exclude_none=True),
        request=request,
    )

    return OrgDetailOut(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


@router.delete("/{org_id}", status_code=204)
async def delete_org(
    org_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    org = await service.get_org(org_id)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role != OrgMemberRole.OWNER:
        raise Forbidden("Owner access required")

    # Audit log before deletion
    await AuditService(db).log(
        org_id=org_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="org.deleted",
        resource_type="organization",
        resource_id=str(org_id),
        details={"name": org.name if org else None},
        request=request,
    )

    await service.delete_org(org_id)


@router.get("/{org_id}/members", response_model=list[OrgMemberOut])
async def list_members(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    members = await service.list_members(org_id)
    return [
        OrgMemberOut(
            user_id=str(user.id),
            email=user.email,
            name=user.name,
            role=mem.role.value,
            joined_at=mem.created_at,
        )
        for user, mem in members
    ]


@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(
    org_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")

    await service.remove_member(org_id, user_id)


# Invite endpoints
@router.post("/{org_id}/invite", response_model=InviteOut)
async def create_invite(
    org_id: UUID,
    payload: InviteCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")

    invite = await service.create_invite(
        org_id, payload.email, current_user.id, payload.role
    )
    return InviteOut(
        id=str(invite.id),
        org_id=str(invite.org_id),
        email=invite.email,
        role=invite.role,
        status=invite.status.value,
        token=invite.token,
        expires_at=invite.expires_at,
        created_at=invite.created_at,
    )


@router.get("/{org_id}/invites", response_model=list[InviteOut])
async def list_invites(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")

    invites = await service.list_invites(org_id)
    return [
        InviteOut(
            id=str(inv.id),
            org_id=str(inv.org_id),
            email=inv.email,
            role=inv.role,
            status=inv.status.value,
            token=inv.token,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
        )
        for inv in invites
    ]


@router.post("/invites/accept", response_model=OrgMemberOut)
async def accept_invite(
    payload: InviteAcceptIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.accept_invite(payload.token, current_user.id)

    # Get user info for response
    members = await service.list_members(membership.org_id)
    for user, mem in members:
        if user.id == current_user.id:
            return OrgMemberOut(
                user_id=str(user.id),
                email=user.email,
                name=user.name,
                role=mem.role.value,
                joined_at=mem.created_at,
            )

    # Fallback
    return OrgMemberOut(
        user_id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=membership.role.value,
        joined_at=membership.created_at,
    )


@router.delete("/{org_id}/invites/{invite_id}", status_code=204)
async def cancel_invite(
    org_id: UUID,
    invite_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OrgService(db)
    membership = await service.get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")

    await service.cancel_invite(invite_id)
