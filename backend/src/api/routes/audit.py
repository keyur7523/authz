from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.audit import AuditLogOut, AuditListOut
from src.services.audit_service import AuditService
from src.services.org_service import OrgService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.api.dependencies import get_current_user
from src.core.exceptions import Forbidden

router = APIRouter(tags=["audit"])


async def _check_org_admin(service: OrgService, org_id: UUID, user_id: UUID):
    membership = await service.get_membership(org_id, user_id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")
    return membership


@router.get("/orgs/{org_id}/audit", response_model=AuditListOut)
async def query_audit_logs(
    org_id: UUID,
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    actor_id: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query audit logs with filters."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    actor_uuid = UUID(actor_id) if actor_id else None
    logs, total = await AuditService(db).query(
        org_id=org_id,
        action=action,
        resource_type=resource_type,
        actor_id=actor_uuid,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return AuditListOut(
        logs=[
            AuditLogOut(
                id=str(log.id),
                org_id=str(log.org_id),
                actor_id=str(log.actor_id) if log.actor_id else None,
                actor_email=log.actor_email,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/orgs/{org_id}/audit/export")
async def export_audit_logs(
    org_id: UUID,
    format: str = Query("json", pattern="^(json|csv)$"),
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    actor_id: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export audit logs in JSON or CSV format."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    actor_uuid = UUID(actor_id) if actor_id else None
    content, media_type = await AuditService(db).export(
        org_id=org_id,
        format=format,
        action=action,
        resource_type=resource_type,
        actor_id=actor_uuid,
        start_date=start_date,
        end_date=end_date,
    )

    filename = f"audit_logs_{org_id}.{format}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
