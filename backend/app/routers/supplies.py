from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.supply import (
    SupplyCreate,
    SupplyResponse,
    SupplyStockUpdate,
    SupplyUpdate,
)
from app.services.supply_service import (
    create_supply,
    deactivate_supply,
    activate_supply,
    get_supply_or_404,
    list_supplies,
    update_supply,
    update_supply_stock,
)

router = APIRouter(prefix="/supplies", tags=["Supplies"])


@router.get("", response_model=list[SupplyResponse])
def read_supplies(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    keyword: str | None = Query(default=None, min_length=1, max_length=255),
    category_id: int | None = Query(default=None, ge=1),
    managed_department_id: int | None = Query(default=None, ge=1),
    low_stock_only: bool = Query(default=False),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_supplies(
        db=db,
        skip=skip,
        limit=limit,
        keyword=keyword,
        category_id=category_id,
        managed_department_id=managed_department_id,
        low_stock_only=low_stock_only,
        is_active=is_active,
        current_user=current_user,
    )


@router.get("/{supply_id}", response_model=SupplyResponse)
def read_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_supply_or_404(
        db=db,
        supply_id=supply_id,
        current_user=current_user,
    )


@router.post("", response_model=SupplyResponse, status_code=status.HTTP_201_CREATED)
def create_new_supply(
    payload: SupplyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return create_supply(db=db, payload=payload)


@router.put("/{supply_id}", response_model=SupplyResponse)
def update_existing_supply(
    supply_id: int,
    payload: SupplyUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    supply = get_supply_or_404(db=db, supply_id=supply_id)
    return update_supply(db=db, supply=supply, payload=payload)


@router.patch("/{supply_id}/stock", response_model=SupplyResponse)
def update_existing_supply_stock(
    supply_id: int,
    payload: SupplyStockUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    supply = get_supply_or_404(db=db, supply_id=supply_id)
    return update_supply_stock(db=db, supply=supply, payload=payload)


@router.patch("/{supply_id}/deactivate", response_model=SupplyResponse)
def deactivate_existing_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    supply = get_supply_or_404(db=db, supply_id=supply_id)
    return deactivate_supply(db=db, supply=supply)

@router.patch("/{supply_id}/activate", response_model=SupplyResponse)
def activate_existing_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    supply = get_supply_or_404(db=db, supply_id=supply_id)
    return activate_supply(db=db, supply=supply)