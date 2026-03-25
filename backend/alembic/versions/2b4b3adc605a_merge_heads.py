"""merge heads

Revision ID: 2b4b3adc605a
Revises: 95eb652c1439, v6_001
Create Date: 2026-03-26 01:02:05.912788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b4b3adc605a'
down_revision: Union[str, Sequence[str], None] = ('95eb652c1439', 'v6_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
