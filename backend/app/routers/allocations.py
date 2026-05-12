from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.allocation import AllocationStatus, AllocationType
from app.models.user import User, UserRole
from app.schemas.allocation import (
    AllocationCreate,
    AllocationResponse,
    AllocationStatusUpdate,
    AllocationUpdate,
)
from app.services.allocation_service import (
    create_allocation,
    deactivate_allocation,
    get_allocation_or_404,
    list_allocations,
    update_allocation,
    update_allocation_status,
)

router = APIRouter(prefix="/allocations", tags=["Allocations"])


@router.get("", response_model=list[AllocationResponse])
def read_allocations(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    keyword: str | None = Query(default=None, min_length=1, max_length=255),
    allocation_type: AllocationType | None = Query(default=None),
    status_filter: AllocationStatus | None = Query(default=None, alias="status"),
    allocated_department_id: int | None = Query(default=None, ge=1),
    allocated_user_id: int | None = Query(default=None, ge=1),
    asset_id: int | None = Query(default=None, ge=1),
    supply_id: int | None = Query(default=None, ge=1),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_allocations(
        db=db,
        skip=skip,
        limit=limit,
        keyword=keyword,
        allocation_type=allocation_type.value if allocation_type is not None else None,
        status_filter=status_filter.value if status_filter is not None else None,
        allocated_department_id=allocated_department_id,
        allocated_user_id=allocated_user_id,
        asset_id=asset_id,
        supply_id=supply_id,
        is_active=is_active,
        current_user=current_user,
    )


@router.get("/{allocation_id}", response_model=AllocationResponse)
def read_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_allocation_or_404(
        db=db,
        allocation_id=allocation_id,
        current_user=current_user,
    )


@router.post("", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def create_new_allocation(
    payload: AllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return create_allocation(db=db, payload=payload, current_user=current_user)


@router.put("/{allocation_id}", response_model=AllocationResponse)
def update_existing_allocation(
    allocation_id: int,
    payload: AllocationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    allocation = get_allocation_or_404(db=db, allocation_id=allocation_id)
    return update_allocation(db=db, allocation=allocation, payload=payload)


@router.patch("/{allocation_id}/status", response_model=AllocationResponse)
def update_existing_allocation_status(
    allocation_id: int,
    payload: AllocationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    allocation = get_allocation_or_404(db=db, allocation_id=allocation_id)
    return update_allocation_status(
        db=db,
        allocation=allocation,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{allocation_id}/deactivate", response_model=AllocationResponse)
def deactivate_existing_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    allocation = get_allocation_or_404(db=db, allocation_id=allocation_id)
    return deactivate_allocation(db=db, allocation=allocation)