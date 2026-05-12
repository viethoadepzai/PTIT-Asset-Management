from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.department_quantity_asset_allocation import (
    DepartmentQuantityAssetAllocation,
)
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/department-allocations",
    tags=["Department Quantity Asset Allocations"],
)


# =========================================================
# RESPONSE SCHEMA
# =========================================================

class AllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department_id: int
    quantity_asset_id: int
    allocated_quantity: int
    notes: str | None = None
    is_active: bool

    department_name: str | None = None
    department_code: str | None = None
    quantity_asset_name: str | None = None
    quantity_asset_code: str | None = None

    created_at: datetime
    updated_at: datetime


def _map_allocation(alloc: DepartmentQuantityAssetAllocation) -> AllocationResponse:
    return AllocationResponse(
        id=alloc.id,
        department_id=alloc.department_id,
        quantity_asset_id=alloc.quantity_asset_id,
        allocated_quantity=alloc.allocated_quantity,
        notes=alloc.notes,
        is_active=alloc.is_active,
        department_name=alloc.department.name if alloc.department else None,
        department_code=alloc.department.code if alloc.department else None,
        quantity_asset_name=alloc.quantity_asset.name if alloc.quantity_asset else None,
        quantity_asset_code=alloc.quantity_asset.code if alloc.quantity_asset else None,
        created_at=alloc.created_at,
        updated_at=alloc.updated_at,
    )


# =========================================================
# LIST ALL ALLOCATIONS
# =========================================================

@router.get(
    "",
    response_model=list[AllocationResponse],
)
def list_department_allocations(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
    department_id: int | None = Query(default=None, ge=1),
    quantity_asset_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lấy danh sách phân bổ tài sản số lượng lớn cho phòng ban."""
    statement = (
        select(DepartmentQuantityAssetAllocation)
        .options(
            selectinload(DepartmentQuantityAssetAllocation.department),
            selectinload(DepartmentQuantityAssetAllocation.quantity_asset),
        )
        .order_by(DepartmentQuantityAssetAllocation.id.desc())
        .offset(skip)
        .limit(limit)
    )

    # Manager chỉ xem phòng ban mình
    if current_user.role == UserRole.MANAGER and current_user.department_id:
        statement = statement.where(
            DepartmentQuantityAssetAllocation.department_id == current_user.department_id
        )
    elif department_id is not None:
        statement = statement.where(
            DepartmentQuantityAssetAllocation.department_id == department_id
        )

    if quantity_asset_id is not None:
        statement = statement.where(
            DepartmentQuantityAssetAllocation.quantity_asset_id == quantity_asset_id
        )

    allocations = list(db.scalars(statement).all())
    return [_map_allocation(a) for a in allocations]
