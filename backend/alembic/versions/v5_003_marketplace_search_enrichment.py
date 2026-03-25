"""Add response_time_hours and success_stories to therapist_profiles

Revision ID: v5_003b
Revises: v5_003a
Create Date: 2026-03-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v5_003b"
down_revision: Union[str, None] = "v5_003a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "therapist_profiles",
        sa.Column("response_time_hours", sa.Integer(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("success_stories", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("therapist_profiles", "success_stories")
    op.drop_column("therapist_profiles", "response_time_hours")
