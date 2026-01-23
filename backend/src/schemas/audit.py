from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class AuditLogOut(BaseModel):
    id: str
    org_id: str
    actor_id: str | None
    actor_email: str | None
    action: str
    resource_type: str
    resource_id: str | None
    details: dict | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class AuditQueryParams(BaseModel):
    action: str | None = None
    resource_type: str | None = None
    actor_id: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    limit: int = Field(default=50, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class AuditListOut(BaseModel):
    logs: list[AuditLogOut]
    total: int
    limit: int
    offset: int


class AuditExportParams(BaseModel):
    format: Literal["json", "csv"] = "json"
    action: str | None = None
    resource_type: str | None = None
    actor_id: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
