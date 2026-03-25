"""add_onboarding_fields_to_therapist

Revision ID: 95eb652c1439
Revises: v5_003
Create Date: 2026-03-26 00:15:22.475530

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "95eb652c1439"
down_revision: Union[str, Sequence[str], None] = "v5_003b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "therapists", sa.Column("default_session_duration", sa.Integer(), nullable=True)
    )
    op.add_column(
        "therapists", sa.Column("default_price", sa.Numeric(10, 2), nullable=True)
    )
    op.add_column(
        "therapists",
        sa.Column(
            "onboarding_completed", sa.Boolean(), server_default="false", nullable=False
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("therapists", "onboarding_completed")
    op.drop_column("therapists", "default_price")
    op.drop_column("therapists", "default_session_duration")
