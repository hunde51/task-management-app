from __future__ import annotations

from pydantic import BaseModel

from .user import UserResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    token: TokenResponse
    user: UserResponse
