from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.asset import AssetCondition, AssetStatus
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetCreate,
    AssetResponse,
    AssetStatusUpdate,
    AssetUpdate,
)
from app.services.asset_service import (
    create_asset,
    deactivate_asset,
    activate_asset,
    get_asset_or_404,
    list_assets,
    update_asset,
    update_asset_status,
)

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=list[AssetResponse])
def read_assets(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    keyword: str | None = Query(default=None, min_length=1, max_length=255),
    category_id: int | None = Query(default=None, ge=1),
    status_filter: AssetStatus | None = Query(default=None, alias="status"),
    condition_filter: AssetCondition | None = Query(
        default=None,
        alias="condition",
    ),
    assigned_department_id: int | None = Query(default=None, ge=1),
    assigned_user_id: int | None = Query(default=None, ge=1),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_assets(
        db=db,
        skip=skip,
        limit=limit,
        keyword=keyword,
        category_id=category_id,
        status_filter=status_filter.value if status_filter is not None else None,
        condition_filter=condition_filter.value
        if condition_filter is not None
        else None,
        assigned_department_id=assigned_department_id,
        assigned_user_id=assigned_user_id,
        is_active=is_active,
        current_user=current_user,
    )


@router.get("/{asset_id}", response_model=AssetResponse)
def read_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_asset_or_404(
        db=db,
        asset_id=asset_id,
        current_user=current_user,
    )


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_new_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return create_asset(db=db, payload=payload)


@router.put("/{asset_id}", response_model=AssetResponse)
def update_existing_asset(
    asset_id: int,
    payload: AssetUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    asset = get_asset_or_404(db=db, asset_id=asset_id)
    return update_asset(db=db, asset=asset, payload=payload)


@router.patch("/{asset_id}/status", response_model=AssetResponse)
def update_existing_asset_status(
    asset_id: int,
    payload: AssetStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    asset = get_asset_or_404(db=db, asset_id=asset_id)
    return update_asset_status(db=db, asset=asset, payload=payload)


@router.patch("/{asset_id}/deactivate", response_model=AssetResponse)
def deactivate_existing_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    asset = get_asset_or_404(db=db, asset_id=asset_id)
    return deactivate_asset(db=db, asset=asset)

@router.patch("/{asset_id}/activate", response_model=AssetResponse)
def activate_existing_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN))
):
    asset = get_asset_or_404(db=db, asset_id=asset_id)
    return activate_asset(db=db, asset=asset)