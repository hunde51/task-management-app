from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginResponse, TokenResponse


def register_user(
    db: Session,
    *,
    username: str,
    email: str,
    first_name: str,
    last_name: str,
    password: str,
) -> User:
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise BadRequestException("Username already registered")

    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise BadRequestException("Email already registered")

    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedException("Incorrect username or password")
    if not user.is_active:
        raise UnauthorizedException("User is inactive")
    return user


def login_user(db: Session, username: str, password: str) -> LoginResponse:
    user = authenticate_user(db, username, password)
    token = create_access_token(user.id)

    return LoginResponse(
        token=TokenResponse(access_token=token),
        user=user,
    )
