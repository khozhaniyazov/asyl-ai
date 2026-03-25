"""Enhance marketplace: profile fields, verification, review replies

Revision ID: v5_002
Revises: v5_001
Create Date: 2026-03-25

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v5_002"
down_revision: Union[str, None] = "v5_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- TherapistProfile: new fields ---
    op.add_column(
        "therapist_profiles",
        sa.Column("video_intro_url", sa.String(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("license_number", sa.String(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("credential_documents", sa.JSON(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("age_groups", sa.JSON(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("verification_submitted_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "therapist_profiles",
        sa.Column("verification_notes", sa.Text(), nullable=True),
    )

    # --- Review: therapist reply ---
    op.add_column(
        "reviews",
        sa.Column("therapist_reply", sa.Text(), nullable=True),
    )
    op.add_column(
        "reviews",
        sa.Column("therapist_reply_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("reviews", "therapist_reply_at")
    op.drop_column("reviews", "therapist_reply")
    op.drop_column("therapist_profiles", "verification_notes")
    op.drop_column("therapist_profiles", "verification_submitted_at")
    op.drop_column("therapist_profiles", "age_groups")
    op.drop_column("therapist_profiles", "credential_documents")
    op.drop_column("therapist_profiles", "license_number")
    op.drop_column("therapist_profiles", "video_intro_url")
