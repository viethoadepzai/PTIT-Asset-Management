from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.services.department_service import (
    create_department,
    deactivate_department,
    delete_department,
    get_department_or_404,
    list_departments,
    update_department,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentResponse])
def read_departments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_departments(db=db, skip=skip, limit=limit, is_active=is_active)


@router.get("/{department_id}", response_model=DepartmentResponse)
def read_department(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return get_department_or_404(db=db, department_id=department_id)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return create_department(db=db, payload=payload)


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_existing_department(
    department_id: int,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    department = get_department_or_404(db=db, department_id=department_id)
    return update_department(db=db, department=department, payload=payload)


@router.patch("/{department_id}/deactivate", response_model=DepartmentResponse)
def deactivate_existing_department(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    department = get_department_or_404(db=db, department_id=department_id)
    return deactivate_department(db=db, department=department)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_department(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    department = get_department_or_404(db=db, department_id=department_id)
    delete_department(db=db, department=department)
