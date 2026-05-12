from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import (
    activate_user,
    create_user,
    deactivate_user,
    get_user_or_404,
    list_users,
    update_user,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
def read_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    keyword: str | None = Query(default=None, min_length=1, max_length=255),
    department_id: int | None = Query(default=None, ge=1),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return list_users(
        db=db,
        skip=skip,
        limit=limit,
        keyword=keyword,
        department_id=department_id,
        role=role.value if role is not None else None,
        is_active=is_active,
    )


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in {UserRole.ADMIN, UserRole.MANAGER} and current_user.id != user_id:
        # Tự xem thông tin của mình thì được, xem người khác thì không.
        return get_user_or_404(db=db, user_id=current_user.id)
    return get_user_or_404(db=db, user_id=user_id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    return create_user(db=db, payload=payload)


@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = get_user_or_404(db=db, user_id=user_id)
    return update_user(db=db, user=user, payload=payload)


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = get_user_or_404(db=db, user_id=user_id)
    return deactivate_user(db=db, user=user)


@router.patch("/{user_id}/activate", response_model=UserResponse)
def activate_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = get_user_or_404(db=db, user_id=user_id)
    return activate_user(db=db, user=user)
