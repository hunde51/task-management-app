from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import Base, engine, ensure_legacy_task_schema
from app.core.error_handlers import register_error_handlers
from app.routes import auth, projects, tasks, teams
from app.schemas.common import ApiResponse

# Ensure models are imported so metadata is complete.
from app import models  # noqa: F401

app = FastAPI(title=settings.APP_NAME)

dev_local_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if settings.APP_ENV != "production" else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=dev_local_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

# Keep create_all for local DX; production should use Alembic migrations.
Base.metadata.create_all(bind=engine)
ensure_legacy_task_schema()

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(projects.router)
app.include_router(tasks.router)


@app.get("/health", response_model=ApiResponse[dict[str, str]])
def health_check():
    url = engine.url
    with engine.connect() as connection:
        db_identity = connection.execute(
            text("SELECT current_database() AS database_name, current_user AS database_user")
        ).mappings().one()

    return ApiResponse(
        message="Service is healthy",
        data={
            "status": "ok",
            "database_backend": url.get_backend_name(),
            "database_name": str(db_identity["database_name"]),
            "database_host": str(url.host or ""),
            "database_user": str(db_identity["database_user"]),
        },
    )
