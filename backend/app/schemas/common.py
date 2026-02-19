from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: T | None = None

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    data: None = None
    errors: list[ErrorDetail] | None = None
