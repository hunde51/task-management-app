from __future__ import annotations

from typing import Any


class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        message: str,
        *,
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        self.status_code = status_code
        self.message = message
        self.errors = errors
        super().__init__(message)


class BadRequestException(AppException):
    def __init__(self, message: str, *, errors: list[dict[str, Any]] | None = None) -> None:
        super().__init__(400, message, errors=errors)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(401, message)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(403, message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Not found") -> None:
        super().__init__(404, message)


class ConflictException(AppException):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(409, message)
