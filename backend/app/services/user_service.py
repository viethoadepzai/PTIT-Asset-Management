from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_password_hash
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> User | None:
    statement = (
        select(User)
        .options(selectinload(User.department))
        .where(User.id == user_id)
    )
    return db.scalar(statement)


def get_user_by_username(db: Session, username: str) -> User | None:
    statement = select(User).where(User.username == username)
    return db.scalar(statement)


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def list_users(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    keyword: str | None = None,
    department_id: int | None = None,
    role: str | None = None,
    is_active: bool | None = None,
) -> list[User]:
    statement = (
        select(User)
        .options(selectinload(User.department))
        .order_by(User.id.desc())
        .offset(skip)
        .limit(limit)
    )

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                User.username.ilike(normalized_keyword),
                User.full_name.ilike(normalized_keyword),
                User.email.ilike(normalized_keyword),
            )
        )

    if department_id is not None:
        statement = statement.where(User.department_id == department_id)

    if role is not None:
        statement = statement.where(User.role == role)

    if is_active is not None:
        statement = statement.where(User.is_active == is_active)

    return list(db.scalars(statement).all())


def create_user(db: Session, payload: UserCreate) -> User:
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creating admin accounts via /users is not allowed",
        )

    existing_user = db.scalar(
        select(User).where(
            or_(User.username == payload.username, User.email == payload.email)
        )
    )
    if existing_user is not None:
        detail = (
            "Username already exists"
            if existing_user.username == payload.username
            else "Email already exists"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    department_id = payload.department_id
    if department_id is not None:
        department = db.get(Department, department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    user = User(
        username=payload.username.strip(),
        email=payload.email.strip().lower(),
        full_name=payload.full_name.strip(),
        phone_number=payload.phone_number.strip() if payload.phone_number else None,
        role=payload.role,
        department_id=department_id,
        is_active=payload.is_active if payload.role != UserRole.ADMIN else True,
        hashed_password=get_password_hash(payload.password),
        must_change_password=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return get_user_or_404(db=db, user_id=user.id)


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    update_data = payload.model_dump(exclude_unset=True)

    if "username" in update_data and update_data["username"] is not None:
        normalized_username = update_data["username"].strip()
        existing = db.scalar(
            select(User).where(
                User.username == normalized_username,
                User.id != user.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )
        user.username = normalized_username

    if "email" in update_data and update_data["email"] is not None:
        normalized_email = update_data["email"].strip().lower()
        existing = db.scalar(
            select(User).where(
                User.email == normalized_email,
                User.id != user.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        user.email = normalized_email

    if "full_name" in update_data and update_data["full_name"] is not None:
        user.full_name = update_data["full_name"].strip()

    if "phone_number" in update_data:
        user.phone_number = (
            update_data["phone_number"].strip()
            if update_data["phone_number"]
            else None
        )

    if "role" in update_data and update_data["role"] is not None:
        new_role = update_data["role"]

        if new_role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Promoting users to admin via /users is not allowed",
            )

        if user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Changing admin role via /users is not allowed",
            )

        user.role = new_role

    if "department_id" in update_data:
        department_id = update_data["department_id"]
        if department_id is not None:
            department = db.get(Department, department_id)
            if department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Department not found",
                )
        user.department_id = department_id

    if "is_active" in update_data and update_data["is_active"] is not None:
        # Admin users must always be active
        if user.role == UserRole.ADMIN:
            user.is_active = True
        else:
            user.is_active = update_data["is_active"]

    db.add(user)
    db.commit()
    db.refresh(user)
    return get_user_or_404(db=db, user_id=user.id)


def deactivate_user(db: Session, user: User) -> User:
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate admin users",
        )
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return get_user_or_404(db=db, user_id=user.id)


def activate_user(db: Session, user: User) -> User:
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return get_user_or_404(db=db, user_id=user.id)


def get_user_or_404(db: Session, user_id: int) -> User:
    user = get_user_by_id(db=db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user