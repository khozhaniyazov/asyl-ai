"""Add payout system: bank_accounts, payouts tables, commission fields, is_admin

Revision ID: v6_001
Revises: v5_003b
Create Date: 2026-03-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "v6_001"
down_revision: Union[str, None] = "v5_003b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Therapist: add is_admin ---
    op.add_column(
        "therapists",
        sa.Column("is_admin", sa.Boolean(), server_default="0", nullable=True),
    )

    # --- Bank Accounts ---
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "therapist_id",
            sa.Integer(),
            sa.ForeignKey("therapists.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("bank_name", sa.String(), nullable=False),
        sa.Column("account_holder", sa.String(), nullable=False),
        sa.Column("account_number", sa.String(), nullable=False),
        sa.Column("kaspi_phone", sa.String(), nullable=True),
        sa.Column("is_verified", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # --- Payouts ---
    op.create_table(
        "payouts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "therapist_id", sa.Integer(), sa.ForeignKey("therapists.id"), nullable=False
        ),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("net_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(), server_default="pending", index=True),
        sa.Column(
            "bank_account_id",
            sa.Integer(),
            sa.ForeignKey("bank_accounts.id"),
            nullable=True,
        ),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("requested_at", sa.DateTime(), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # --- MarketplaceBooking: commission fields ---
    op.add_column(
        "marketplace_bookings",
        sa.Column("commission_rate", sa.Numeric(5, 2), server_default="7.5"),
    )
    op.add_column(
        "marketplace_bookings",
        sa.Column("commission_amount", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "marketplace_bookings",
        sa.Column("net_amount", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "marketplace_bookings",
        sa.Column(
            "payout_id", sa.Integer(), sa.ForeignKey("payouts.id"), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_column("marketplace_bookings", "payout_id")
    op.drop_column("marketplace_bookings", "net_amount")
    op.drop_column("marketplace_bookings", "commission_amount")
    op.drop_column("marketplace_bookings", "commission_rate")
    op.drop_table("payouts")
    op.drop_table("bank_accounts")
    op.drop_column("therapists", "is_admin")
