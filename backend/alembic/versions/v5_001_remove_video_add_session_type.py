"""Remove video sessions, add session_type to appointments, add homework video

Revision ID: v5_001
Revises: v4_001
Create Date: 2026-03-25

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v5_001"
down_revision: Union[str, None] = "v4_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop video_sessions table
    op.drop_table("video_sessions")

    # Add session_type to appointments
    op.add_column(
        "appointments",
        sa.Column(
            "session_type",
            sa.Enum("in_person", "online", "hybrid", name="sessiontype"),
            nullable=False,
            server_default="in_person",
        ),
    )

    # Add parent_video_url to homework_assignments
    op.add_column(
        "homework_assignments",
        sa.Column("parent_video_url", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("homework_assignments", "parent_video_url")
    op.drop_column("appointments", "session_type")

    # Recreate video_sessions table
    op.create_table(
        "video_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("room_url", sa.String(), nullable=False),
        sa.Column("therapist_join_url", sa.String(), nullable=True),
        sa.Column("parent_join_url", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
