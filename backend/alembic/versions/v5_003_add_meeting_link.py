"""Add meeting_link to appointments

Revision ID: v5_003a
Revises: v5_002
Create Date: 2026-03-25

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v5_003a"
down_revision: Union[str, None] = "v5_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("meeting_link", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("appointments", "meeting_link")
