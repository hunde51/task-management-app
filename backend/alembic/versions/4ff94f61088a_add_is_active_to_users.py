"""add is_active to users

Revision ID: 4ff94f61088a
Revises: 
Create Date: 2026-02-16 10:11:35.521506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ff94f61088a'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true'))
    )

def downgrade() -> None:
    pass  # optional if you don't need to rollback
