from pydantic import BaseModel, Field


class AuthorizeRequest(BaseModel):
    org_id: str
    principal_id: str
    action: str
    resource: str
    context: dict = Field(default_factory=dict)


class AuthorizeResponse(BaseModel):
    allowed: bool
    matched_policy_id: str | None = None
    effect: str | None = None
    reason: str


class BulkAuthorizeRequest(BaseModel):
    org_id: str
    requests: list[AuthorizeRequest]


class AuthorizeBulkItem(BaseModel):
    principal_id: str
    action: str
    resource: str
    context: dict = Field(default_factory=dict)


class BulkAuthorizeResponse(BaseModel):
    results: list[AuthorizeResponse]
