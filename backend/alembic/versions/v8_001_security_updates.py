"""Add security fields for OTP attempts

Revision ID: v8_001
Revises: v7_001
Create Date: 2026-03-27

"""

from alembic import op
import sqlalchemy as sa

revision = "v8_001"
down_revision = "v7_001"
branch_labels = None
depends_on = None


def upgrade():
    # Add otp_attempts column with default value (SQLite compatible)
    op.add_column(
        "parents",
        sa.Column("otp_attempts", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_column("parents", "otp_attempts")
