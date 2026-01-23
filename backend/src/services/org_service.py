import secrets
from datetime import timedelta
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.organization import Organization, OrgMembership, OrgMemberRole
from src.db.models.user import User
from src.db.models.invite import OrgInvite, InviteStatus
from src.core.exceptions import NotFound, Conflict, Forbidden, BadRequest
from src.core.security import utc_now
from src.services.audit_service import AuditService


class OrgService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_org(self, user_id: UUID, payload):
        existing = await self.db.execute(
            select(Organization).where(Organization.slug == payload.slug)
        )
        if existing.scalar_one_or_none():
            raise Conflict("Organization with this slug already exists")

        org = Organization(name=payload.name, slug=payload.slug)
        self.db.add(org)
        await self.db.flush()

        membership = OrgMembership(
            user_id=user_id,
            org_id=org.id,
            role=OrgMemberRole.OWNER,
        )
        self.db.add(membership)
        await self.db.commit()
        await self.db.refresh(org)
        return org, membership

    async def list_orgs(self, user_id: UUID):
        res = await self.db.execute(
            select(Organization, OrgMembership.role)
            .join(OrgMembership)
            .where(OrgMembership.user_id == user_id)
        )
        return res.all()

    async def get_org(self, org_id: UUID) -> Organization | None:
        res = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        return res.scalar_one_or_none()

    async def get_org_by_slug(self, slug: str) -> Organization | None:
        res = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return res.scalar_one_or_none()

    async def get_membership(
        self, org_id: UUID, user_id: UUID
    ) -> OrgMembership | None:
        res = await self.db.execute(
            select(OrgMembership).where(
                OrgMembership.org_id == org_id,
                OrgMembership.user_id == user_id,
            )
        )
        return res.scalar_one_or_none()

    async def list_members(self, org_id: UUID):
        res = await self.db.execute(
            select(User, OrgMembership)
            .join(OrgMembership, OrgMembership.user_id == User.id)
            .where(OrgMembership.org_id == org_id)
        )
        return res.all()

    async def add_member(
        self, org_id: UUID, user_id: UUID, role: OrgMemberRole = OrgMemberRole.MEMBER
    ) -> OrgMembership:
        existing = await self.get_membership(org_id, user_id)
        if existing:
            raise Conflict("User is already a member of this organization")

        membership = OrgMembership(user_id=user_id, org_id=org_id, role=role)
        self.db.add(membership)
        await self.db.commit()
        await self.db.refresh(membership)
        return membership

    async def update_member_role(
        self, org_id: UUID, user_id: UUID, role: OrgMemberRole
    ) -> OrgMembership:
        membership = await self.get_membership(org_id, user_id)
        if not membership:
            raise NotFound("Membership not found")

        membership.role = role
        await self.db.commit()
        await self.db.refresh(membership)
        return membership

    async def remove_member(self, org_id: UUID, user_id: UUID):
        membership = await self.get_membership(org_id, user_id)
        if not membership:
            raise NotFound("Membership not found")

        if membership.role == OrgMemberRole.OWNER:
            owners = await self.db.execute(
                select(OrgMembership).where(
                    OrgMembership.org_id == org_id,
                    OrgMembership.role == OrgMemberRole.OWNER,
                )
            )
            if len(owners.all()) <= 1:
                raise Forbidden("Cannot remove the last owner")

        await self.db.delete(membership)
        await self.db.commit()

    async def update_org(self, org_id: UUID, payload) -> Organization:
        org = await self.get_org(org_id)
        if not org:
            raise NotFound("Organization not found")

        if payload.name is not None:
            org.name = payload.name
        if payload.slug is not None:
            # Check for slug conflicts
            existing = await self.get_org_by_slug(payload.slug)
            if existing and existing.id != org_id:
                raise Conflict("Organization with this slug already exists")
            org.slug = payload.slug

        await self.db.commit()
        await self.db.refresh(org)
        return org

    async def delete_org(self, org_id: UUID):
        org = await self.get_org(org_id)
        if not org:
            raise NotFound("Organization not found")

        # Delete all memberships first
        memberships = await self.db.execute(
            select(OrgMembership).where(OrgMembership.org_id == org_id)
        )
        for membership in memberships.scalars().all():
            await self.db.delete(membership)

        await self.db.delete(org)
        await self.db.commit()

    # Invite methods
    async def create_invite(
        self, org_id: UUID, email: str, invited_by: UUID, role: str = "member"
    ) -> OrgInvite:
        # Check if user is already a member
        user_res = await self.db.execute(select(User).where(User.email == email))
        user = user_res.scalar_one_or_none()
        if user:
            existing_membership = await self.get_membership(org_id, user.id)
            if existing_membership:
                raise Conflict("User is already a member of this organization")

        # Check for existing pending invite
        existing_invite = await self.db.execute(
            select(OrgInvite).where(
                OrgInvite.org_id == org_id,
                OrgInvite.email == email,
                OrgInvite.status == InviteStatus.PENDING,
            )
        )
        if existing_invite.scalar_one_or_none():
            raise Conflict("An invite for this email is already pending")

        # Create invite with 7 day expiry
        token = secrets.token_urlsafe(32)
        invite = OrgInvite(
            org_id=org_id,
            email=email,
            invited_by=invited_by,
            role=role,
            token=token,
            expires_at=utc_now() + timedelta(days=7),
        )
        self.db.add(invite)
        await self.db.commit()
        await self.db.refresh(invite)
        return invite

    async def list_invites(self, org_id: UUID) -> list[OrgInvite]:
        res = await self.db.execute(
            select(OrgInvite)
            .where(OrgInvite.org_id == org_id)
            .order_by(OrgInvite.created_at.desc())
        )
        return list(res.scalars().all())

    async def get_invite_by_token(self, token: str) -> OrgInvite | None:
        res = await self.db.execute(
            select(OrgInvite).where(OrgInvite.token == token)
        )
        return res.scalar_one_or_none()

    async def accept_invite(self, token: str, user_id: UUID) -> OrgMembership:
        invite = await self.get_invite_by_token(token)
        if not invite:
            raise NotFound("Invite not found")

        if invite.status != InviteStatus.PENDING:
            raise BadRequest(f"Invite is no longer pending (status: {invite.status.value})")

        if invite.expires_at < utc_now():
            invite.status = InviteStatus.EXPIRED
            await self.db.commit()
            raise BadRequest("Invite has expired")

        # Check if user email matches invite email
        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if not user or user.email != invite.email:
            raise Forbidden("This invite is for a different email address")

        # Check if user is already a member
        existing = await self.get_membership(invite.org_id, user_id)
        if existing:
            invite.status = InviteStatus.ACCEPTED
            await self.db.commit()
            raise Conflict("User is already a member of this organization")

        # Create membership
        role = OrgMemberRole(invite.role) if invite.role in [r.value for r in OrgMemberRole] else OrgMemberRole.MEMBER
        membership = OrgMembership(
            user_id=user_id,
            org_id=invite.org_id,
            role=role,
        )
        self.db.add(membership)

        # Mark invite as accepted
        invite.status = InviteStatus.ACCEPTED
        await self.db.commit()
        await self.db.refresh(membership)
        return membership

    async def cancel_invite(self, invite_id: UUID) -> OrgInvite:
        res = await self.db.execute(
            select(OrgInvite).where(OrgInvite.id == invite_id)
        )
        invite = res.scalar_one_or_none()
        if not invite:
            raise NotFound("Invite not found")

        if invite.status != InviteStatus.PENDING:
            raise BadRequest("Only pending invites can be cancelled")

        invite.status = InviteStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(invite)
        return invite
