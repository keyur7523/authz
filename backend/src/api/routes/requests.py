from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.access_request import (
    AccessRequestCreateIn,
    AccessRequestOut,
    ApprovalActionIn,
    ApprovalActionOut,
    PendingRequestsOut,
)
from src.services.workflow_service import WorkflowService
from src.services.org_service import OrgService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.db.models.access_request import RequestStatus
from src.api.dependencies import get_current_user
from src.core.exceptions import NotFound, Forbidden

router = APIRouter(tags=["requests"])


def _request_to_out(request) -> AccessRequestOut:
    return AccessRequestOut(
        id=str(request.id),
        org_id=str(request.org_id),
        requester_id=str(request.requester_id),
        requested_role_id=str(request.requested_role_id)
        if request.requested_role_id
        else None,
        requested_permission=request.requested_permission,
        resource_id=request.resource_id,
        justification=request.justification,
        status=request.status.value,
        duration_hours=request.duration_hours,
        expires_at=request.expires_at,
        resolved_at=request.resolved_at,
        created_at=request.created_at,
        updated_at=request.updated_at,
        approval_actions=[
            ApprovalActionOut(
                id=str(a.id),
                request_id=str(a.request_id),
                approver_id=str(a.approver_id),
                action=a.action,
                comment=a.comment,
                created_at=a.created_at,
            )
            for a in request.approval_actions
        ],
    )


async def _check_org_admin(service: OrgService, org_id: UUID, user_id: UUID):
    membership = await service.get_membership(org_id, user_id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")
    return membership


@router.post("/orgs/{org_id}/requests", response_model=AccessRequestOut)
async def submit_request(
    org_id: UUID,
    payload: AccessRequestCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new access request."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    request = await WorkflowService(db).submit_request(
        org_id, current_user.id, payload
    )
    return _request_to_out(request)


@router.get("/orgs/{org_id}/requests", response_model=list[AccessRequestOut])
async def list_my_requests(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's requests."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    requests = await WorkflowService(db).list_my_requests(org_id, current_user.id)
    return [_request_to_out(r) for r in requests]


@router.get("/orgs/{org_id}/requests/pending", response_model=PendingRequestsOut)
async def list_pending_requests(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending requests (admin only)."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    requests = await WorkflowService(db).list_pending_requests(org_id)
    return PendingRequestsOut(
        requests=[_request_to_out(r) for r in requests],
        total=len(requests),
    )


@router.get("/orgs/{org_id}/requests/all", response_model=list[AccessRequestOut])
async def list_all_requests(
    org_id: UUID,
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all requests (admin only)."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    status_enum = RequestStatus(status) if status else None
    requests = await WorkflowService(db).list_all_requests(org_id, status_enum)
    return [_request_to_out(r) for r in requests]


@router.get("/orgs/{org_id}/requests/{request_id}", response_model=AccessRequestOut)
async def get_request(
    org_id: UUID,
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific request."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    request = await WorkflowService(db).get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    # Only requester or admin can view
    is_admin = membership.role in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]
    if request.requester_id != current_user.id and not is_admin:
        raise Forbidden("Not authorized to view this request")

    return _request_to_out(request)


@router.post("/orgs/{org_id}/requests/{request_id}/approve", response_model=AccessRequestOut)
async def approve_request(
    org_id: UUID,
    request_id: UUID,
    payload: ApprovalActionIn | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a pending request (admin only)."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = WorkflowService(db)
    request = await service.get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    comment = payload.comment if payload else None
    request = await service.approve_request(request_id, current_user.id, comment)
    return _request_to_out(request)


@router.post("/orgs/{org_id}/requests/{request_id}/deny", response_model=AccessRequestOut)
async def deny_request(
    org_id: UUID,
    request_id: UUID,
    payload: ApprovalActionIn | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deny a pending request (admin only)."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = WorkflowService(db)
    request = await service.get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    reason = payload.comment if payload else None
    request = await service.deny_request(request_id, current_user.id, reason)
    return _request_to_out(request)


@router.post("/orgs/{org_id}/requests/{request_id}/cancel", response_model=AccessRequestOut)
async def cancel_request(
    org_id: UUID,
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pending request (requester only)."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    service = WorkflowService(db)
    request = await service.get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    request = await service.cancel_request(request_id, current_user.id)
    return _request_to_out(request)


@router.post("/orgs/{org_id}/requests/{request_id}/request-info", response_model=AccessRequestOut)
async def request_more_info(
    org_id: UUID,
    request_id: UUID,
    payload: ApprovalActionIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request more information from the requester (admin only)."""
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = WorkflowService(db)
    request = await service.get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    if not payload.comment:
        raise Forbidden("A question is required when requesting more info")

    request = await service.request_more_info(request_id, current_user.id, payload.comment)
    return _request_to_out(request)


@router.post("/orgs/{org_id}/requests/{request_id}/provide-info", response_model=AccessRequestOut)
async def provide_info(
    org_id: UUID,
    request_id: UUID,
    payload: ApprovalActionIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provide additional information requested by approver (requester only)."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    service = WorkflowService(db)
    request = await service.get_request(request_id)
    if not request or request.org_id != org_id:
        raise NotFound("Request not found")

    if not payload.comment:
        raise Forbidden("A response is required")

    request = await service.provide_info(request_id, current_user.id, payload.comment)
    return _request_to_out(request)
