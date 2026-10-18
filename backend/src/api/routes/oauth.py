import secrets
from datetime import timedelta
import httpx
from jose import jwt
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.config import settings
from src.db.database import get_db
from src.db.models.user import User
from src.core.security import create_tokens, hash_token, decode_token, utc_now
from src.core.exceptions import BadRequest, Unauthorized

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])



def _create_state(provider: str) -> str:
    """Signed, short-lived state so nothing has to be stored server-side."""
    payload = {
        "type": "oauth_state",
        "provider": provider,
        "nonce": secrets.token_urlsafe(16),
        "exp": utc_now() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def _verify_state(state: str, provider: str):
    try:
        payload = decode_token(state)
    except Exception:
        raise Unauthorized("Invalid OAuth state")
    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise Unauthorized("Invalid OAuth state")


class OAuthUrlResponse(BaseModel):
    url: str
    state: str


class OAuthCallbackResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


# GitHub OAuth
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github", response_model=OAuthUrlResponse)
async def github_login():
    """Get GitHub OAuth authorization URL."""
    if not settings.GITHUB_CLIENT_ID:
        raise BadRequest("GitHub OAuth is not configured")

    state = _create_state("github")

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": f"{settings.OAUTH_REDIRECT_URL}?provider=github",
        "scope": "read:user user:email",
        "state": state,
    }
    url = f"{GITHUB_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

    return OAuthUrlResponse(url=url, state=state)


@router.get("/github/callback")
async def github_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Handle GitHub OAuth callback."""
    _verify_state(state, "github")

    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise BadRequest("GitHub OAuth is not configured")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

        if token_response.status_code != 200:
            raise Unauthorized("Failed to get access token from GitHub")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise Unauthorized("Invalid token response from GitHub")

        # Get user info
        user_response = await client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )

        if user_response.status_code != 200:
            raise Unauthorized("Failed to get user info from GitHub")

        user_data = user_response.json()

        # Only trust a verified primary email; we link accounts by email, so an unverified one allows takeover
        email = None
        emails_response = await client.get(
            GITHUB_EMAILS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )
        if emails_response.status_code == 200:
            email = next(
                (e.get("email") for e in emails_response.json() if e.get("primary") and e.get("verified")),
                None,
            )

        if not email:
            raise Unauthorized("Could not get a verified email from GitHub")

    # Find or create user
    user = await _find_or_create_oauth_user(
        db,
        email=email,
        name=user_data.get("name") or user_data.get("login"),
        avatar_url=user_data.get("avatar_url"),
        oauth_provider="github",
        oauth_id=str(user_data.get("id")),
    )

    # Generate tokens
    tokens = create_tokens(str(user.id))
    user.refresh_token_hash = hash_token(tokens["refresh_token"])
    await db.commit()

    return OAuthCallbackResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        },
    )


# Google OAuth
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google", response_model=OAuthUrlResponse)
async def google_login():
    """Get Google OAuth authorization URL."""
    if not settings.GOOGLE_CLIENT_ID:
        raise BadRequest("Google OAuth is not configured")

    state = _create_state("google")

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.OAUTH_REDIRECT_URL}?provider=google",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
    }
    url = f"{GOOGLE_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

    return OAuthUrlResponse(url=url, state=state)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    _verify_state(state, "google")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise BadRequest("Google OAuth is not configured")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.OAUTH_REDIRECT_URL}?provider=google",
            },
        )

        if token_response.status_code != 200:
            raise Unauthorized("Failed to get access token from Google")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise Unauthorized("Invalid token response from Google")

        # Get user info
        user_response = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_response.status_code != 200:
            raise Unauthorized("Failed to get user info from Google")

        user_data = user_response.json()

    email = user_data.get("email")
    if not email or not user_data.get("verified_email"):
        raise Unauthorized("Could not get a verified email from Google")

    # Find or create user
    user = await _find_or_create_oauth_user(
        db,
        email=email,
        name=user_data.get("name"),
        avatar_url=user_data.get("picture"),
        oauth_provider="google",
        oauth_id=str(user_data.get("id")),
    )

    # Generate tokens
    tokens = create_tokens(str(user.id))
    user.refresh_token_hash = hash_token(tokens["refresh_token"])
    await db.commit()

    return OAuthCallbackResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        },
    )


async def _find_or_create_oauth_user(
    db: AsyncSession,
    email: str,
    name: str,
    avatar_url: str | None,
    oauth_provider: str,
    oauth_id: str,
) -> User:
    """Find existing user by email/OAuth ID or create new one."""
    # First try to find by OAuth provider and ID
    result = await db.execute(
        select(User).where(
            User.oauth_provider == oauth_provider,
            User.oauth_id == oauth_id,
        )
    )
    user = result.scalar_one_or_none()

    if user:
        # Update user info
        user.avatar_url = avatar_url
        if name:
            user.name = name
        await db.commit()
        await db.refresh(user)
        return user

    # Try to find by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Link OAuth provider to existing account
        user.oauth_provider = oauth_provider
        user.oauth_id = oauth_id
        user.avatar_url = avatar_url
        await db.commit()
        await db.refresh(user)
        return user

    # Create new user
    user = User(
        email=email,
        name=name or email.split("@")[0],
        password_hash="",  # OAuth users don't have password
        avatar_url=avatar_url,
        oauth_provider=oauth_provider,
        oauth_id=oauth_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
