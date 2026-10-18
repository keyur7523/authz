"""user_roles.expires_at for time-limited grants

Revision ID: b3c1d2e4f5a6
Revises: 9f6ead30d25b
Create Date: 2026-10-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3c1d2e4f5a6'
down_revision: Union[str, None] = '9f6ead30d25b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_roles', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('user_roles', 'expires_at')
