from __future__ import annotations

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _engine_connect_args(database_url: str) -> dict[str, object]:
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def _create_engine(database_url: str):
    return create_engine(
        database_url,
        pool_pre_ping=True,
        connect_args=_engine_connect_args(database_url),
    )


def _assert_connection(database_engine, database_url: str) -> None:
    try:
        with database_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise RuntimeError(
            f"Could not connect to database: {database_url}. "
            "Check PostgreSQL status, DATABASE_URL, and credentials."
        ) from exc


def _build_engine():
    if settings.REQUIRE_POSTGRES and not settings.DATABASE_URL.startswith("postgresql"):
        raise RuntimeError(
            "Invalid DATABASE_URL: PostgreSQL is required (expected URL starting with 'postgresql')."
        )

    primary_engine = _create_engine(settings.DATABASE_URL)
    _assert_connection(primary_engine, settings.DATABASE_URL)
    return primary_engine


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_legacy_task_schema() -> None:
    """Patch common legacy task-table drift for local/dev environments."""
    if engine.url.get_backend_name() != "postgresql":
        return

    inspector = inspect(engine)
    if "tasks" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("tasks")}
    ddl_statements: list[str] = []

    if "status" not in existing_columns:
        ddl_statements.append("ALTER TABLE tasks ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'todo'")
    if "assigned_user_id" not in existing_columns:
        ddl_statements.append("ALTER TABLE tasks ADD COLUMN assigned_user_id INTEGER")
    if "due_date" not in existing_columns:
        ddl_statements.append("ALTER TABLE tasks ADD COLUMN due_date TIMESTAMPTZ")
    if "updated_at" not in existing_columns:
        ddl_statements.append("ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ")

    if not ddl_statements:
        return

    with engine.begin() as connection:
        for statement in ddl_statements:
            connection.execute(text(statement))

        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks (status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_assigned_user_id ON tasks (assigned_user_id)"))
        connection.execute(
            text(
                """
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'assigned_user_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_tasks_assigned_user_id_users'
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT fk_tasks_assigned_user_id_users
            FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;
                """
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
