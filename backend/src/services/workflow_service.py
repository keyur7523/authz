from uuid import UUID
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.models.access_request import AccessRequest, ApprovalAction, RequestStatus
from src.db.models.role import UserRole
from src.core.security import utc_now
from src.core.exceptions import NotFound, Forbidden, BadRequest


class WorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_request(
        self, org_id: UUID, requester_id: UUID, payload
    ) -> AccessRequest:
        """Submit a new access request."""
        if not payload.requested_role_id and not payload.requested_permission:
            raise BadRequest("Must request either a role or a permission")

        request = AccessRequest(
            org_id=org_id,
            requester_id=requester_id,
            requested_role_id=UUID(payload.requested_role_id)
            if payload.requested_role_id
            else None,
            requested_permission=payload.requested_permission,
            resource_id=payload.resource_id,
            justification=payload.justification,
            duration_hours=payload.duration_hours,
        )
        self.db.add(request)
        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def get_request(self, request_id: UUID) -> AccessRequest | None:
        """Get a request by ID with approval actions."""
        res = await self.db.execute(
            select(AccessRequest)
            .where(AccessRequest.id == request_id)
            .options(selectinload(AccessRequest.approval_actions))
        )
        return res.scalar_one_or_none()

    async def list_my_requests(
        self, org_id: UUID, user_id: UUID
    ) -> list[AccessRequest]:
        """List requests submitted by a user."""
        res = await self.db.execute(
            select(AccessRequest)
            .where(AccessRequest.org_id == org_id, AccessRequest.requester_id == user_id)
            .options(selectinload(AccessRequest.approval_actions))
            .order_by(AccessRequest.created_at.desc())
        )
        return list(res.scalars().all())

    async def list_pending_requests(self, org_id: UUID) -> list[AccessRequest]:
        """List pending requests for approvers."""
        res = await self.db.execute(
            select(AccessRequest)
            .where(
                AccessRequest.org_id == org_id,
                AccessRequest.status == RequestStatus.PENDING,
            )
            .options(selectinload(AccessRequest.approval_actions))
            .order_by(AccessRequest.created_at.asc())
        )
        return list(res.scalars().all())

    async def list_all_requests(
        self, org_id: UUID, status: RequestStatus | None = None
    ) -> list[AccessRequest]:
        """List all requests, optionally filtered by status."""
        query = select(AccessRequest).where(AccessRequest.org_id == org_id)
        if status:
            query = query.where(AccessRequest.status == status)
        query = query.options(selectinload(AccessRequest.approval_actions)).order_by(
            AccessRequest.created_at.desc()
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def approve_request(
        self, request_id: UUID, approver_id: UUID, comment: str | None = None
    ) -> AccessRequest:
        """Approve a pending request."""
        request = await self.get_request(request_id)
        if not request:
            raise NotFound("Request not found")

        if request.status != RequestStatus.PENDING:
            raise BadRequest(f"Request is already {request.status.value}")

        # Record approval action
        action = ApprovalAction(
            request_id=request_id,
            approver_id=approver_id,
            action="approve",
            comment=comment,
        )
        self.db.add(action)

        # Update request status
        request.status = RequestStatus.APPROVED
        request.resolved_at = utc_now()

        # Set expiration if duration specified
        if request.duration_hours:
            request.expires_at = utc_now() + timedelta(hours=request.duration_hours)

        # Grant access
        await self._grant_access(request, approver_id)

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def deny_request(
        self, request_id: UUID, approver_id: UUID, reason: str | None = None
    ) -> AccessRequest:
        """Deny a pending request."""
        request = await self.get_request(request_id)
        if not request:
            raise NotFound("Request not found")

        if request.status != RequestStatus.PENDING:
            raise BadRequest(f"Request is already {request.status.value}")

        # Record denial action
        action = ApprovalAction(
            request_id=request_id,
            approver_id=approver_id,
            action="deny",
            comment=reason,
        )
        self.db.add(action)

        # Update request status
        request.status = RequestStatus.DENIED
        request.resolved_at = utc_now()

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def cancel_request(self, request_id: UUID, user_id: UUID) -> AccessRequest:
        """Cancel a pending request (only by requester)."""
        request = await self.get_request(request_id)
        if not request:
            raise NotFound("Request not found")

        if request.requester_id != user_id:
            raise Forbidden("Only the requester can cancel this request")

        if request.status not in [RequestStatus.PENDING, RequestStatus.INFO_REQUESTED]:
            raise BadRequest(f"Request is already {request.status.value}")

        request.status = RequestStatus.CANCELLED
        request.resolved_at = utc_now()

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def request_more_info(
        self, request_id: UUID, approver_id: UUID, question: str
    ) -> AccessRequest:
        """Request more information from the requester."""
        request = await self.get_request(request_id)
        if not request:
            raise NotFound("Request not found")

        if request.status not in [RequestStatus.PENDING, RequestStatus.INFO_REQUESTED]:
            raise BadRequest(f"Request is already {request.status.value}")

        # Record request_info action
        action = ApprovalAction(
            request_id=request_id,
            approver_id=approver_id,
            action="request_info",
            comment=question,
        )
        self.db.add(action)

        # Update request status
        request.status = RequestStatus.INFO_REQUESTED

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def provide_info(
        self, request_id: UUID, user_id: UUID, response: str
    ) -> AccessRequest:
        """Provide additional info requested by approver (requester only)."""
        request = await self.get_request(request_id)
        if not request:
            raise NotFound("Request not found")

        if request.requester_id != user_id:
            raise Forbidden("Only the requester can provide information")

        if request.status != RequestStatus.INFO_REQUESTED:
            raise BadRequest("No information was requested for this request")

        # Record info provided action
        action = ApprovalAction(
            request_id=request_id,
            approver_id=user_id,  # Requester is the "actor" here
            action="info_provided",
            comment=response,
        )
        self.db.add(action)

        # Move back to pending for review
        request.status = RequestStatus.PENDING

        await self.db.commit()
        await self.db.refresh(request)
        return request

    async def _grant_access(self, request: AccessRequest, assigned_by: UUID):
        """Grant the requested access after approval."""
        if request.requested_role_id:
            # Check if user already has this role
            existing = await self.db.execute(
                select(UserRole).where(
                    UserRole.user_id == request.requester_id,
                    UserRole.role_id == request.requested_role_id,
                    UserRole.org_id == request.org_id,
                )
            )
            if not existing.scalar_one_or_none():
                user_role = UserRole(
                    user_id=request.requester_id,
                    role_id=request.requested_role_id,
                    org_id=request.org_id,
                    assigned_by=assigned_by,
                )
                self.db.add(user_role)
