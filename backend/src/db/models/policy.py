import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, JSON

from src.db.models.base import Base
from src.core.security import utc_now

# Use JSONB for PostgreSQL, JSON for SQLite (testing)
JSONType = JSONB().with_variant(JSON(), "sqlite")


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    effect: Mapped[str] = mapped_column(String(10))  # 'allow' or 'deny'

    # JSON fields for flexible policy definition (JSONB on PostgreSQL, JSON on SQLite)
    principals: Mapped[dict] = mapped_column(JSONType, default=dict)  # {"roles": [...], "users": [...]}
    actions: Mapped[list] = mapped_column(JSONType, default=list)  # ["resource:action", ...]
    resources: Mapped[list] = mapped_column(JSONType, default=list)  # ["resource:id", ...]
    conditions: Mapped[dict | None] = mapped_column(JSONType, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)  # Higher = evaluated first

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
