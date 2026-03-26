"""Remove AI/audio fields from sessions table

Revision ID: v7_001
Revises: v6_001
Create Date: 2026-03-27

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "v7_001"
down_revision: Union[str, None] = "v6_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite doesn't support DROP COLUMN, so we use batch mode
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.drop_column("audio_file_path")
        batch_op.drop_column("raw_transcript")


def downgrade() -> None:
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("audio_file_path", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("raw_transcript", sa.Text(), nullable=True))
