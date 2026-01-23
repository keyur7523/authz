from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class PolicyPrincipals(BaseModel):
    roles: list[str] = Field(default_factory=list)
    users: list[str] = Field(default_factory=list)


class PolicyCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    effect: Literal["allow", "deny"]
    principals: PolicyPrincipals = Field(default_factory=PolicyPrincipals)
    actions: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)
    conditions: dict | None = None
    priority: int = 0


class PolicyUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    effect: Literal["allow", "deny"] | None = None
    principals: PolicyPrincipals | None = None
    actions: list[str] | None = None
    resources: list[str] | None = None
    conditions: dict | None = None
    priority: int | None = None
    is_active: bool | None = None


class PolicyOut(BaseModel):
    id: str
    org_id: str
    name: str
    description: str | None
    effect: str
    principals: dict
    actions: list
    resources: list
    conditions: dict | None
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime


class PolicyTestRequest(BaseModel):
    principal_id: str
    action: str
    resource: str
    context: dict = Field(default_factory=dict)


class PolicyTestResponse(BaseModel):
    allowed: bool
    matched_policy: str | None = None
    effect: str | None = None
    reason: str


class PolicyValidateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    effect: str
    principals: dict = Field(default_factory=dict)
    actions: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)
    conditions: dict | None = None
    priority: int = 0


class PolicyValidateResponse(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
