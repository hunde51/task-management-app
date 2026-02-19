from __future__ import annotations

import traceback

from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import ProgrammingError

from .config import settings
from .exceptions import AppException


def _error_payload(
    message: str,
    *,
    errors: list[dict[str, str]] | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "success": False,
        "message": message,
        "data": None,
    }
    if errors:
        payload["errors"] = errors
    return payload


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(_, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.message, errors=exc.errors),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(detail),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError):
        errors = [
            {
                "field": ".".join(str(part) for part in err.get("loc", []) if part != "body") or None,
                "message": err.get("msg", "Invalid value"),
            }
            for err in exc.errors()
        ]

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_payload("Validation error", errors=errors),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(_, exc: Exception):
        if isinstance(exc, ProgrammingError):
            message = "Database schema mismatch. Run `alembic upgrade head` on the same DATABASE_URL."
            if settings.APP_ENV != "production":
                message = f"{message} Details: {exc}"
                traceback.print_exception(type(exc), exc, exc.__traceback__)
        elif settings.APP_ENV != "production":
            traceback.print_exception(type(exc), exc, exc.__traceback__)
            message = f"Internal server error: {exc}"
        else:
            message = "Internal server error"

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_payload(message),
        )
