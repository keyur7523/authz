from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.policy import (
    PolicyCreateIn,
    PolicyUpdateIn,
    PolicyOut,
    PolicyTestRequest,
    PolicyTestResponse,
    PolicyValidateRequest,
    PolicyValidateResponse,
)
from src.services.policy_service import PolicyService
from src.services.org_service import OrgService
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.organization import OrgMemberRole
from src.api.dependencies import get_current_user
from src.core.exceptions import NotFound, Forbidden

router = APIRouter(tags=["policies"])


async def _check_org_admin(service: OrgService, org_id: UUID, user_id: UUID):
    membership = await service.get_membership(org_id, user_id)
    if not membership:
        raise Forbidden("Not a member of this organization")
    if membership.role not in [OrgMemberRole.OWNER, OrgMemberRole.ADMIN]:
        raise Forbidden("Admin access required")
    return membership


@router.post("/orgs/{org_id}/policies", response_model=PolicyOut)
async def create_policy(
    org_id: UUID,
    payload: PolicyCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)
    policy = await PolicyService(db).create_policy(org_id, payload)
    return PolicyOut(
        id=str(policy.id),
        org_id=str(policy.org_id),
        name=policy.name,
        description=policy.description,
        effect=policy.effect,
        principals=policy.principals,
        actions=policy.actions,
        resources=policy.resources,
        conditions=policy.conditions,
        is_active=policy.is_active,
        priority=policy.priority,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.get("/orgs/{org_id}/policies", response_model=list[PolicyOut])
async def list_policies(
    org_id: UUID,
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    policies = await PolicyService(db).list_policies(org_id, active_only)
    return [
        PolicyOut(
            id=str(p.id),
            org_id=str(p.org_id),
            name=p.name,
            description=p.description,
            effect=p.effect,
            principals=p.principals,
            actions=p.actions,
            resources=p.resources,
            conditions=p.conditions,
            is_active=p.is_active,
            priority=p.priority,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in policies
    ]


@router.get("/orgs/{org_id}/policies/{policy_id}", response_model=PolicyOut)
async def get_policy(
    org_id: UUID,
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    policy = await PolicyService(db).get_policy(policy_id)
    if not policy or policy.org_id != org_id:
        raise NotFound("Policy not found")

    return PolicyOut(
        id=str(policy.id),
        org_id=str(policy.org_id),
        name=policy.name,
        description=policy.description,
        effect=policy.effect,
        principals=policy.principals,
        actions=policy.actions,
        resources=policy.resources,
        conditions=policy.conditions,
        is_active=policy.is_active,
        priority=policy.priority,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.put("/orgs/{org_id}/policies/{policy_id}", response_model=PolicyOut)
async def update_policy(
    org_id: UUID,
    policy_id: UUID,
    payload: PolicyUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = PolicyService(db)
    policy = await service.get_policy(policy_id)
    if not policy or policy.org_id != org_id:
        raise NotFound("Policy not found")

    policy = await service.update_policy(policy_id, payload)
    return PolicyOut(
        id=str(policy.id),
        org_id=str(policy.org_id),
        name=policy.name,
        description=policy.description,
        effect=policy.effect,
        principals=policy.principals,
        actions=policy.actions,
        resources=policy.resources,
        conditions=policy.conditions,
        is_active=policy.is_active,
        priority=policy.priority,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.delete("/orgs/{org_id}/policies/{policy_id}", status_code=204)
async def delete_policy(
    org_id: UUID,
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_org_admin(OrgService(db), org_id, current_user.id)

    service = PolicyService(db)
    policy = await service.get_policy(policy_id)
    if not policy or policy.org_id != org_id:
        raise NotFound("Policy not found")

    await service.delete_policy(policy_id)


@router.post("/orgs/{org_id}/policies/test", response_model=PolicyTestResponse)
async def test_policy(
    org_id: UUID,
    payload: PolicyTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test policy evaluation without actually enforcing it."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    result = await PolicyService(db).evaluate(
        org_id=org_id,
        principal_id=UUID(payload.principal_id),
        action=payload.action,
        resource=payload.resource,
        context=payload.context,
    )
    return PolicyTestResponse(
        allowed=result["allowed"],
        matched_policy=result["matched_policy_id"],
        effect=result["effect"],
        reason=result["reason"],
    )


@router.post("/orgs/{org_id}/policies/validate", response_model=PolicyValidateResponse)
async def validate_policy(
    org_id: UUID,
    payload: PolicyValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Validate a policy definition without saving it."""
    membership = await OrgService(db).get_membership(org_id, current_user.id)
    if not membership:
        raise Forbidden("Not a member of this organization")

    result = PolicyService(db).validate_policy(payload.model_dump())
    return PolicyValidateResponse(
        valid=result["valid"],
        errors=result["errors"],
        warnings=result["warnings"],
    )
