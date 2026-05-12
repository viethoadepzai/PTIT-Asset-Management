from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.auth import ChangePasswordRequest, RegisterRequest


def get_user_by_username(db: Session, username: str) -> User | None:
    statement = select(User).where(User.username == username)
    return db.scalar(statement)


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    statement = select(User).where(User.id == user_id)
    return db.scalar(statement)

def authenticate_user(db: Session, username: str, password: str) -> User:
    user = get_user_by_username(db=db, username=username)
    print("LOGIN USERNAME:", username)
    print("FOUND USER:", user.username if user else None)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print("PASSWORD OK:", verify_password(password, user.hashed_password))

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user
# def authenticate_user(db: Session, username: str, password: str) -> User:
#     user = get_user_by_username(db=db, username=username)
#     if user is None or not verify_password(password, user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )

#     if not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="User account is inactive",
#         )

#     return user


def register_user(db: Session, payload: RegisterRequest) -> User:
    existing_user_statement = select(User).where(
        or_(User.username == payload.username, User.email == payload.email)
    )
    existing_user = db.scalar(existing_user_statement)

    if existing_user is not None:
        if existing_user.username == payload.username:
            detail = "Username already exists"
        else:
            detail = "Email already exists"

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

    if payload.department_id is not None:
        department = db.get(Department, payload.department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.STAFF,
        department_id=payload.department_id,
        phone_number=payload.phone_number,
        is_active=True,
        must_change_password=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_user_access_token(user: User) -> str:
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(subject=user.id, expires_delta=expires_delta)


def change_password(db: Session, user: User, payload: ChangePasswordRequest) -> User:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    user.must_change_password = False

    db.add(user)
    db.commit()
    db.refresh(user)
    return user