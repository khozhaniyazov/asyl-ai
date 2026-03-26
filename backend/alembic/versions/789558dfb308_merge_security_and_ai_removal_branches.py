"""merge security and ai removal branches

Revision ID: 789558dfb308
Revises: 2b4b3adc605a, v8_001
Create Date: 2026-03-27 02:09:28.692946

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '789558dfb308'
down_revision: Union[str, Sequence[str], None] = ('2b4b3adc605a', 'v8_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
