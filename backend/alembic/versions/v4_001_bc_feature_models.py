"""B+C feature models: treatment plans, messaging, clinics, video sessions

Revision ID: v4_001
Revises: v3_001
Create Date: 2026-03-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v4_001"
down_revision: Union[str, None] = "v3_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Treatment Plans ---
    op.create_table(
        "treatment_plans",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("diagnosis", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("target_end_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "paused", "cancelled", name="planstatus"),
            nullable=True,
            server_default="active",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # --- Treatment Goals ---
    op.create_table(
        "treatment_goals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "plan_id", sa.Integer(), sa.ForeignKey("treatment_plans.id"), nullable=False
        ),
        sa.Column(
            "type",
            sa.Enum("long_term", "short_term", name="goaltype"),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("target_sound", sa.String(), nullable=True),
        sa.Column("measurable_criteria", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "not_started",
                "in_progress",
                "achieved",
                "discontinued",
                name="goalstatus",
            ),
            nullable=True,
            server_default="not_started",
        ),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("achieved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Goal Templates ---
    op.create_table(
        "goal_templates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=True
        ),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("measurable_criteria", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Conversations ---
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column(
            "parent_id", sa.Integer(), sa.ForeignKey("parents.id"), nullable=False
        ),
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Messages ---
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("conversations.id"),
            nullable=False,
        ),
        sa.Column(
            "sender_type",
            sa.Enum("therapist", "parent", name="sendertype"),
            nullable=False,
        ),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("media_url", sa.String(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Clinics ---
    op.create_table(
        "clinics",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "owner_therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
        ),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Clinic Memberships ---
    op.create_table(
        "clinic_memberships",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "clinic_id", sa.Integer(), sa.ForeignKey("clinics.id"), nullable=False
        ),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column(
            "role",
            sa.Enum("owner", "admin", "therapist", name="clinicrole"),
            nullable=True,
            server_default="therapist",
        ),
        sa.Column("joined_at", sa.DateTime(), nullable=True),
    )

    # --- Video Sessions ---
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


def downgrade() -> None:
    op.drop_table("video_sessions")
    op.drop_table("clinic_memberships")
    op.drop_table("clinics")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("goal_templates")
    op.drop_table("treatment_goals")
    op.drop_table("treatment_plans")

    for enum_name in [
        "planstatus",
        "goaltype",
        "goalstatus",
        "sendertype",
        "clinicrole",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
