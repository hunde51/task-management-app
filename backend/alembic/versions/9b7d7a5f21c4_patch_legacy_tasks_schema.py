"""patch legacy tasks schema

Revision ID: 9b7d7a5f21c4
Revises: 4ff94f61088a
Create Date: 2026-02-18 15:05:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b7d7a5f21c4"
down_revision: Union[str, None] = "4ff94f61088a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _index_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {index["name"] for index in inspector.get_indexes(table_name)}


def _fk_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {fk["name"] for fk in inspector.get_foreign_keys(table_name) if fk.get("name")}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "tasks" not in inspector.get_table_names():
        return

    columns = _column_names("tasks")

    if "status" not in columns:
        op.add_column(
            "tasks",
            sa.Column("status", sa.String(length=20), nullable=False, server_default="todo"),
        )

    if "assigned_user_id" not in columns:
        op.add_column("tasks", sa.Column("assigned_user_id", sa.Integer(), nullable=True))

    if "due_date" not in columns:
        op.add_column("tasks", sa.Column("due_date", sa.DateTime(timezone=True), nullable=True))

    if "updated_at" not in columns:
        op.add_column("tasks", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    indexes = _index_names("tasks")
    if "ix_tasks_assigned_user_id" not in indexes:
        op.create_index("ix_tasks_assigned_user_id", "tasks", ["assigned_user_id"], unique=False)

    if "ix_tasks_status" not in indexes:
        op.create_index("ix_tasks_status", "tasks", ["status"], unique=False)

    fk_names = _fk_names("tasks")
    if "fk_tasks_assigned_user_id_users" not in fk_names:
        op.create_foreign_key(
            "fk_tasks_assigned_user_id_users",
            "tasks",
            "users",
            ["assigned_user_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    # Intentionally no-op: this patch is intended to safely repair legacy schemas.
    pass
