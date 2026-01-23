from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.authorize import (
    AuthorizeRequest,
    AuthorizeResponse,
    AuthorizeBulkItem,
    BulkAuthorizeResponse,
)
from src.services.policy_service import PolicyService
from src.db.database import get_db
from src.db.models.user import User
from src.api.dependencies import get_current_user

router = APIRouter(prefix="/authorize", tags=["authorize"])


@router.post("", response_model=AuthorizeResponse)
async def authorize(
    payload: AuthorizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluate a single authorization request.
    Returns whether the action is allowed for the principal on the resource.
    """
    result = await PolicyService(db).evaluate(
        org_id=UUID(payload.org_id),
        principal_id=UUID(payload.principal_id),
        action=payload.action,
        resource=payload.resource,
        context=payload.context,
    )
    return AuthorizeResponse(
        allowed=result["allowed"],
        matched_policy_id=result["matched_policy_id"],
        effect=result["effect"],
        reason=result["reason"],
    )


@router.post("/bulk", response_model=BulkAuthorizeResponse)
async def authorize_bulk(
    org_id: str,
    requests: list[AuthorizeBulkItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluate multiple authorization requests in bulk.
    More efficient than making multiple single requests.
    """
    request_dicts = [
        {
            "principal_id": r.principal_id,
            "action": r.action,
            "resource": r.resource,
            "context": r.context,
        }
        for r in requests
    ]

    results = await PolicyService(db).evaluate_bulk(UUID(org_id), request_dicts)

    return BulkAuthorizeResponse(
        results=[
            AuthorizeResponse(
                allowed=r["allowed"],
                matched_policy_id=r["matched_policy_id"],
                effect=r["effect"],
                reason=r["reason"],
            )
            for r in results
        ]
    )
