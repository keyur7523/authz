from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class RegisterIn(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthOut(BaseModel):
    user: UserOut
    tokens: TokenOut


class UserWithOrgsOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime
    organizations: list[dict]
