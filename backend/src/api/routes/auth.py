from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.auth import (
    RegisterIn,
    LoginIn,
    RefreshIn,
    AuthOut,
    TokenOut,
    UserOut,
    UserWithOrgsOut,
)
from src.services.auth_service import AuthService
from src.services.org_service import OrgService
from src.db.database import get_db
from src.db.models.user import User
from src.api.dependencies import get_current_user
from src.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_auth_response(user: User, tokens: dict) -> AuthOut:
    return AuthOut(
        user=UserOut(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
        tokens=TokenOut(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/register", response_model=AuthOut)
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)):
    user, tokens = await AuthService(db).register(payload)
    return _build_auth_response(user, tokens)


@router.post("/login", response_model=AuthOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    user, tokens = await AuthService(db).login(payload)
    return _build_auth_response(user, tokens)


@router.post("/refresh", response_model=TokenOut)
async def refresh(payload: RefreshIn, db: AsyncSession = Depends(get_db)):
    user, tokens = await AuthService(db).refresh(payload.refresh_token)
    return TokenOut(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", status_code=204)
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Logout user by invalidating their refresh token."""
    await AuthService(db).logout(current_user.id)


@router.get("/me", response_model=UserWithOrgsOut)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orgs = await OrgService(db).list_orgs(current_user.id)
    return UserWithOrgsOut(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        organizations=[
            {"id": str(org.id), "name": org.name, "slug": org.slug, "role": role.value}
            for org, role in orgs
        ],
    )
