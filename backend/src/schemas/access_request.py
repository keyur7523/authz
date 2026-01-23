from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class AccessRequestCreateIn(BaseModel):
    requested_role_id: str | None = None
    requested_permission: str | None = None
    resource_id: str | None = None
    justification: str = Field(min_length=10, max_length=1000)
    duration_hours: int | None = Field(default=None, ge=1, le=8760)  # max 1 year


class ApprovalActionIn(BaseModel):
    comment: str | None = Field(default=None, max_length=500)


class ApprovalActionOut(BaseModel):
    id: str
    request_id: str
    approver_id: str
    action: str
    comment: str | None
    created_at: datetime


class AccessRequestOut(BaseModel):
    id: str
    org_id: str
    requester_id: str
    requested_role_id: str | None
    requested_permission: str | None
    resource_id: str | None
    justification: str
    status: str
    duration_hours: int | None
    expires_at: datetime | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime
    approval_actions: list[ApprovalActionOut] = []


class AccessRequestBrief(BaseModel):
    id: str
    requester_id: str
    requested_role_id: str | None
    requested_permission: str | None
    status: str
    created_at: datetime


class PendingRequestsOut(BaseModel):
    requests: list[AccessRequestOut]
    total: int
