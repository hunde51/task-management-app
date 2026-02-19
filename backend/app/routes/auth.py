from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import LoginResponse
from app.schemas.common import ApiResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import login_user, register_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = register_user(
        db,
        username=payload.username.strip(),
        email=payload.email,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        password=payload.password,
    )
    return ApiResponse(message="User registered successfully", data=user)


@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    result = login_user(db, form_data.username.strip(), form_data.password)
    return ApiResponse(message="Login successful", data=result)


@router.get("/me", response_model=ApiResponse[UserResponse])
def me(current_user: User = Depends(get_current_user)):
    return ApiResponse(message="Current user profile", data=current_user)
