"""v3 marketplace models

Revision ID: v3_001
Revises: v2_001
Create Date: 2026-03-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v3_001"
down_revision: Union[str, None] = "v2_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Therapist Profiles ---
    op.create_table(
        "therapist_profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(), nullable=True),
        sa.Column("specializations", sa.JSON(), nullable=True),
        sa.Column("education", sa.Text(), nullable=True),
        sa.Column("certifications", sa.JSON(), nullable=True),
        sa.Column("years_of_experience", sa.Integer(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("district", sa.String(), nullable=True),
        sa.Column(
            "online_available", sa.Boolean(), nullable=True, server_default="false"
        ),
        sa.Column("price_range_min", sa.Numeric(10, 2), nullable=True),
        sa.Column("price_range_max", sa.Numeric(10, 2), nullable=True),
        sa.Column("session_duration", sa.Integer(), nullable=True),
        sa.Column("languages", sa.JSON(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column(
            "verification_status",
            sa.Enum("unverified", "pending", "verified", name="verificationstatus"),
            nullable=True,
            server_default="unverified",
        ),
        sa.Column("is_published", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_therapist_profiles_city", "therapist_profiles", ["city"])
    op.create_index(
        "ix_therapist_profiles_published",
        "therapist_profiles",
        ["is_published"],
    )
    op.create_index(
        "ix_therapist_profiles_verification",
        "therapist_profiles",
        ["verification_status"],
    )

    # --- Reviews ---
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "parent_id", sa.Integer(), sa.ForeignKey("parents.id"), nullable=False
        ),
        sa.Column(
            "therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
        ),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("sessions.id"),
            nullable=True,
            unique=True,
        ),
        sa.Column("rating_overall", sa.Integer(), nullable=False),
        sa.Column("rating_results", sa.Integer(), nullable=True),
        sa.Column("rating_approach", sa.Integer(), nullable=True),
        sa.Column("rating_communication", sa.Integer(), nullable=True),
        sa.Column("rating_punctuality", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("is_published", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_reviews_therapist_id", "reviews", ["therapist_id"])

    # --- Marketplace Bookings ---
    op.create_table(
        "marketplace_bookings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "parent_id", sa.Integer(), sa.ForeignKey("parents.id"), nullable=False
        ),
        sa.Column(
            "therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.Enum("diagnostic", "regular", name="bookingtype"),
            nullable=True,
            server_default="diagnostic",
        ),
        sa.Column("requested_slot", sa.DateTime(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "confirmed", "cancelled", "completed", name="bookingstatus"
            ),
            nullable=True,
            server_default="pending",
        ),
        sa.Column("deposit_paid", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("deposit_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("kaspi_link", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("appointments.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("marketplace_bookings")
    op.drop_table("reviews")
    op.drop_index("ix_therapist_profiles_verification", "therapist_profiles")
    op.drop_index("ix_therapist_profiles_published", "therapist_profiles")
    op.drop_index("ix_therapist_profiles_city", "therapist_profiles")
    op.drop_table("therapist_profiles")

    for enum_name in ["verificationstatus", "bookingtype", "bookingstatus"]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
