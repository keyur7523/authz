from datetime import datetime
from pydantic import BaseModel, Field


class OrgCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=255, pattern=r"^[a-z0-9-]+$")


class OrgUpdateIn(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    slug: str | None = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9-]+$")


class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    role: str


class OrgDetailOut(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime


class OrgMemberOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    joined_at: datetime


class InviteCreateIn(BaseModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    role: str = Field(default="member", pattern=r"^(owner|admin|member)$")


class InviteOut(BaseModel):
    id: str
    org_id: str
    email: str
    role: str
    status: str
    token: str
    expires_at: datetime
    created_at: datetime


class InviteAcceptIn(BaseModel):
    token: str
