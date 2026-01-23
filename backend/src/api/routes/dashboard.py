from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timedelta

from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMembership
from src.db.models.role import Role, UserRole
from src.db.models.permission import Permission
from src.db.models.policy import Policy
from src.db.models.access_request import AccessRequest, RequestStatus
from src.db.models.audit_log import AuditLog
from src.services.org_service import OrgService
from src.api.dependencies import get_current_user
from src.core.exceptions import Forbidden
from src.core.security import utc_now

router = APIRouter(tags=["dashboard"])


class DashboardStats(BaseModel):
    total_members: int
    total_roles: int
    total_permissions: int
    total_policies: int
    active_policies: int
    pending_requests: int
    requests_this_week: int
    approved_this_week: int
    denied_this_week: int
    audit_events_today: int


class RecentActivity(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: str | None
    actor_email: str | None
    created_at: datetime


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_activity: list[RecentActivity]


@router.get("/orgs/{org_id}/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics for the organization."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    now = utc_now()
    week_ago = now - timedelta(days=7)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Count members
    members_result = await db.execute(
        select(func.count(OrgMembership.user_id)).where(OrgMembership.org_id == org_id)
    )
    total_members = members_result.scalar() or 0

    # Count roles
    roles_result = await db.execute(
        select(func.count(Role.id)).where(Role.org_id == org_id)
    )
    total_roles = roles_result.scalar() or 0

    # Count permissions
    permissions_result = await db.execute(
        select(func.count(Permission.id)).where(Permission.org_id == org_id)
    )
    total_permissions = permissions_result.scalar() or 0

    # Count policies
    policies_result = await db.execute(
        select(func.count(Policy.id)).where(Policy.org_id == org_id)
    )
    total_policies = policies_result.scalar() or 0

    active_policies_result = await db.execute(
        select(func.count(Policy.id)).where(
            Policy.org_id == org_id, Policy.is_active == True
        )
    )
    active_policies = active_policies_result.scalar() or 0

    # Count requests
    pending_result = await db.execute(
        select(func.count(AccessRequest.id)).where(
            AccessRequest.org_id == org_id,
            AccessRequest.status == RequestStatus.PENDING,
        )
    )
    pending_requests = pending_result.scalar() or 0

    requests_week_result = await db.execute(
        select(func.count(AccessRequest.id)).where(
            AccessRequest.org_id == org_id,
            AccessRequest.created_at >= week_ago,
        )
    )
    requests_this_week = requests_week_result.scalar() or 0

    approved_week_result = await db.execute(
        select(func.count(AccessRequest.id)).where(
            AccessRequest.org_id == org_id,
            AccessRequest.status == RequestStatus.APPROVED,
            AccessRequest.resolved_at >= week_ago,
        )
    )
    approved_this_week = approved_week_result.scalar() or 0

    denied_week_result = await db.execute(
        select(func.count(AccessRequest.id)).where(
            AccessRequest.org_id == org_id,
            AccessRequest.status == RequestStatus.DENIED,
            AccessRequest.resolved_at >= week_ago,
        )
    )
    denied_this_week = denied_week_result.scalar() or 0

    # Count audit events today
    audit_today_result = await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.org_id == org_id,
            AuditLog.created_at >= today_start,
        )
    )
    audit_events_today = audit_today_result.scalar() or 0

    # Get recent activity (last 10 events)
    recent_logs_result = await db.execute(
        select(AuditLog)
        .where(AuditLog.org_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    recent_logs = recent_logs_result.scalars().all()

    return DashboardResponse(
        stats=DashboardStats(
            total_members=total_members,
            total_roles=total_roles,
            total_permissions=total_permissions,
            total_policies=total_policies,
            active_policies=active_policies,
            pending_requests=pending_requests,
            requests_this_week=requests_this_week,
            approved_this_week=approved_this_week,
            denied_this_week=denied_this_week,
            audit_events_today=audit_events_today,
        ),
        recent_activity=[
            RecentActivity(
                id=str(log.id),
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                actor_email=log.actor_email,
                created_at=log.created_at,
            )
            for log in recent_logs
        ],
    )
