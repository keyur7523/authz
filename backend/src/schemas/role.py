from datetime import datetime
from pydantic import BaseModel, Field


class RoleCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class RoleUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class RoleOut(BaseModel):
    id: str
    org_id: str
    name: str
    description: str | None
    is_system: bool
    created_at: datetime
    updated_at: datetime


class PermissionBrief(BaseModel):
    id: str
    name: str
    description: str | None


class RoleWithPermissions(RoleOut):
    permissions: list[PermissionBrief]


class RoleAssignIn(BaseModel):
    role_id: str


class UserRoleOut(BaseModel):
    id: str
    user_id: str
    role_id: str
    org_id: str
    assigned_by: str | None
    assigned_at: datetime


class AddPermissionsIn(BaseModel):
    permission_ids: list[str]
