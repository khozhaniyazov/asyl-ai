"""v2 complete schema

Revision ID: v2_001
Revises:
Create Date: 2026-03-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "v2_001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Therapists ---
    op.create_table(
        "therapists",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("clinic_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Parents ---
    op.create_table(
        "parents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("phone", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("otp_code_hash", sa.String(), nullable=True),
        sa.Column("otp_expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Patients ---
    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("first_name", sa.String(), index=True),
        sa.Column("last_name", sa.String(), index=True),
        sa.Column("diagnosis", sa.String(), nullable=True),
        sa.Column("parent_phone", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        # v2 fields
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "active", "discharged", "waitlisted", "paused", name="patientstatus"
            ),
            nullable=True,
            server_default="active",
        ),
        sa.Column(
            "parent_id", sa.Integer(), sa.ForeignKey("parents.id"), nullable=True
        ),
    )

    # --- Subscriptions ---
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("plan", sa.String(), nullable=True, server_default="trial"),
        sa.Column("status", sa.String(), nullable=True, server_default="active"),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Session Packages ---
    op.create_table(
        "session_packages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("total_sessions", sa.Integer(), nullable=False),
        sa.Column("used_sessions", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("price_per_session", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "payment_status",
            sa.Enum(
                "pending",
                "partial",
                "paid",
                "overdue",
                "refunded",
                name="paymentstatus",
            ),
            nullable=True,
            server_default="pending",
        ),
        sa.Column("purchased_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Appointments ---
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=True
        ),
        sa.Column("start_time", sa.DateTime(), nullable=True),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "planned",
                "paid",
                "completed",
                "cancelled",
                "no_show",
                name="appointmentstatus",
            ),
            nullable=True,
            server_default="planned",
        ),
        sa.Column("kaspi_link", sa.String(), nullable=True),
        # v2 fields
        sa.Column("session_number", sa.Integer(), nullable=True),
        sa.Column(
            "package_id",
            sa.Integer(),
            sa.ForeignKey("session_packages.id"),
            nullable=True,
        ),
        sa.Column("reminder_sent", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column(
            "requested_by",
            sa.Enum("therapist", "parent", name="requestedby"),
            nullable=True,
            server_default="therapist",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            unique=True,
        ),
        sa.Column("status", sa.String(), nullable=True, server_default="pending"),
        sa.Column("audio_file_path", sa.String(), nullable=True),
        sa.Column("raw_transcript", sa.Text(), nullable=True),
        sa.Column("soap_subjective", sa.Text(), nullable=True),
        sa.Column("soap_objective", sa.Text(), nullable=True),
        sa.Column("soap_assessment", sa.Text(), nullable=True),
        sa.Column("soap_plan", sa.Text(), nullable=True),
        sa.Column("homework_for_parents", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Homework Templates ---
    op.create_table(
        "homework_templates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "articulation",
                "phonology",
                "vocabulary",
                "grammar",
                "fluency",
                "other",
                name="homeworkcategory",
            ),
            nullable=True,
            server_default="other",
        ),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("media_urls", sa.JSON(), nullable=True),
        sa.Column("target_sounds", sa.String(), nullable=True),
        sa.Column("age_range", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # --- Homework Assignments ---
    op.create_table(
        "homework_assignments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "session_id", sa.Integer(), sa.ForeignKey("sessions.id"), nullable=True
        ),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "template_id",
            sa.Integer(),
            sa.ForeignKey("homework_templates.id"),
            nullable=True,
        ),
        sa.Column("custom_instructions", sa.Text(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("parent_completed_at", sa.DateTime(), nullable=True),
        sa.Column("parent_notes", sa.Text(), nullable=True),
        sa.Column("therapist_verified_at", sa.DateTime(), nullable=True),
        sa.Column("therapist_feedback", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "assigned", "completed", "verified", "overdue", name="homeworkstatus"
            ),
            nullable=True,
            server_default="assigned",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Sound Progress Records ---
    op.create_table(
        "sound_progress_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "session_id", sa.Integer(), sa.ForeignKey("sessions.id"), nullable=True
        ),
        sa.Column("sound", sa.String(10), nullable=False),
        sa.Column(
            "stage",
            sa.Enum(
                "not_started",
                "isolation",
                "syllables",
                "words",
                "phrases",
                "connected_speech",
                "automated",
                name="soundstage",
            ),
            nullable=True,
            server_default="not_started",
        ),
        sa.Column("accuracy_percent", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assessed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Therapist Availability ---
    op.create_table(
        "therapist_availability",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("specific_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Schedule Requests ---
    op.create_table(
        "schedule_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "parent_id", sa.Integer(), sa.ForeignKey("parents.id"), nullable=False
        ),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("requested_start", sa.DateTime(), nullable=False),
        sa.Column("requested_end", sa.DateTime(), nullable=True),
        sa.Column(
            "type",
            sa.Enum("new_booking", "reschedule", name="schedulerequesttype"),
            nullable=False,
        ),
        sa.Column(
            "original_appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="schedulerequeststatus"),
            nullable=True,
            server_default="pending",
        ),
        sa.Column("therapist_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Cancellation Records ---
    op.create_table(
        "cancellation_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.Enum("cancellation", "no_show", "late_cancel", name="cancellationtype"),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column(
            "cancelled_by",
            sa.Enum("therapist", "parent", name="cancelledby"),
            nullable=False,
        ),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("fee_charged", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "package_session_returned",
            sa.Boolean(),
            nullable=True,
            server_default="false",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Waitlist Entries ---
    op.create_table(
        "waitlist_entries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False
        ),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("preferred_days", sa.JSON(), nullable=True),
        sa.Column("preferred_times", sa.JSON(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("waiting", "offered", "enrolled", "expired", name="waitliststatus"),
            nullable=True,
            server_default="waiting",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- Reminders ---
    op.create_table(
        "reminders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            nullable=True,
        ),
        sa.Column(
            "homework_assignment_id",
            sa.Integer(),
            sa.ForeignKey("homework_assignments.id"),
            nullable=True,
        ),
        sa.Column(
            "type",
            sa.Enum(
                "session_24h",
                "session_1h",
                "payment_due",
                "homework_due",
                "waitlist_offer",
                name="remindertype",
            ),
            nullable=False,
        ),
        sa.Column(
            "channel",
            sa.Enum("whatsapp", "telegram", "sms", name="reminderchannel"),
            nullable=True,
            server_default="whatsapp",
        ),
        sa.Column("scheduled_for", sa.DateTime(), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("scheduled", "sent", "failed", "cancelled", name="reminderstatus"),
            nullable=True,
            server_default="scheduled",
        ),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("celery_task_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("reminders")
    op.drop_table("waitlist_entries")
    op.drop_table("cancellation_records")
    op.drop_table("schedule_requests")
    op.drop_table("therapist_availability")
    op.drop_table("sound_progress_records")
    op.drop_table("homework_assignments")
    op.drop_table("homework_templates")
    op.drop_table("sessions")
    op.drop_table("appointments")
    op.drop_table("session_packages")
    op.drop_table("subscriptions")
    op.drop_table("patients")
    op.drop_table("parents")
    op.drop_table("therapists")

    # Drop enums
    for enum_name in [
        "patientstatus",
        "appointmentstatus",
        "requestedby",
        "paymentstatus",
        "homeworkcategory",
        "homeworkstatus",
        "soundstage",
        "schedulerequesttype",
        "schedulerequeststatus",
        "cancellationtype",
        "cancelledby",
        "waitliststatus",
        "remindertype",
        "reminderchannel",
        "reminderstatus",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
