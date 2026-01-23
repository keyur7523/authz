from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.user import User
from src.core.security import (
    hash_password,
    verify_password,
    create_tokens,
    decode_token,
    hash_token,
    verify_token_hash,
)
from src.core.exceptions import BadRequest, Unauthorized, NotFound
from src.services.audit_service import AuditService


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload):
        res = await self.db.execute(
            select(User).where(User.email == payload.email)
        )
        if res.scalar_one_or_none():
            raise BadRequest("User already exists")

        user = User(
            email=payload.email,
            name=payload.name,
            password_hash=hash_password(payload.password),
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        tokens = create_tokens(str(user.id))
        # Store refresh token hash for rotation/invalidation
        user.refresh_token_hash = hash_token(tokens["refresh_token"])
        await self.db.commit()
        return user, tokens

    async def login(self, payload):
        res = await self.db.execute(
            select(User).where(User.email == payload.email)
        )
        user = res.scalar_one_or_none()

        if not user or not verify_password(payload.password, user.password_hash):
            raise Unauthorized("Invalid email or password")

        if not user.is_active:
            raise Unauthorized("User account is disabled")

        tokens = create_tokens(str(user.id))
        # Store refresh token hash for rotation/invalidation
        user.refresh_token_hash = hash_token(tokens["refresh_token"])
        await self.db.commit()
        return user, tokens

    async def refresh(self, refresh_token: str):
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise Unauthorized("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise Unauthorized("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise Unauthorized("Invalid refresh token")

        user = await self.get_user(user_id)
        if not user:
            raise Unauthorized("User not found")

        if not user.is_active:
            raise Unauthorized("User account is disabled")

        # Verify refresh token matches stored hash (rotation check)
        if not user.refresh_token_hash or not verify_token_hash(
            refresh_token, user.refresh_token_hash
        ):
            raise Unauthorized("Refresh token has been invalidated")

        # Rotate: create new tokens and store new hash
        tokens = create_tokens(str(user.id))
        user.refresh_token_hash = hash_token(tokens["refresh_token"])
        await self.db.commit()
        return user, tokens

    async def logout(self, user_id: str | UUID):
        """Invalidate refresh token by clearing the stored hash."""
        user = await self.get_user(user_id)
        if not user:
            raise NotFound("User not found")

        user.refresh_token_hash = None
        await self.db.commit()

    async def get_user(self, user_id: str | UUID) -> User | None:
        if isinstance(user_id, str):
            try:
                user_id = UUID(user_id)
            except ValueError:
                return None

        res = await self.db.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        res = await self.db.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none()
