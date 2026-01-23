from datetime import datetime
from pydantic import BaseModel, Field


class PermissionCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r"^[a-z_]+:[a-z_]+$")
    description: str | None = Field(default=None, max_length=500)


class PermissionUpdateIn(BaseModel):
    description: str | None = Field(default=None, max_length=500)


class PermissionOut(BaseModel):
    id: str
    org_id: str
    name: str
    description: str | None
    created_at: datetime


class UserPermissionsOut(BaseModel):
    user_id: str
    org_id: str
    permissions: list[str]
