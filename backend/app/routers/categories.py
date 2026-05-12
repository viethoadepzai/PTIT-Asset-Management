from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_active_user,
    require_roles,
)
from app.models.asset_quantity import AssetQuantity
from app.models.user import User, UserRole
from app.schemas.category import (
    CategoryCreate,
    CategoryDetailResponse,
    CategoryNeedUpdate,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category_service import (
    create_category,
    delete_category,
    get_category_need_or_404,
    get_category_or_404,
    list_categories,
    update_category,
    update_category_need,
    upsert_category_need,
)

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


# =========================================================
# GET ALL CATEGORIES
# =========================================================

@router.get(
    "",
    response_model=list[CategoryResponse],
)
def read_categories(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    category_type: str | None = Query(
        default=None,
        pattern="^(supply|asset)$",
    ),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_categories(
        db=db,
        skip=skip,
        limit=limit,
        category_type=category_type,
    )


# =========================================================
# GET CATEGORY DETAIL
# =========================================================

@router.get(
    "/{category_id}",
    response_model=CategoryDetailResponse,
)
def read_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return get_category_or_404(
        db=db,
        category_id=category_id,
    )


# =========================================================
# GET ASSET QUANTITIES BY CATEGORY
# =========================================================

@router.get(
    "/{category_id}/quantity-assets",
)
def get_quantity_assets_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """
    Lấy danh sách tài sản số lượng lớn theo danh mục.

    Ví dụ:
    Category = Bàn

    Trả về:
    - Bàn 4 chân
    - Bàn 6 chỗ
    """

    category = get_category_or_404(
        db=db,
        category_id=category_id,
    )

    quantity_assets = (
        db.query(AssetQuantity)
        .filter(
            AssetQuantity.category_id == category.id,
            AssetQuantity.is_active.is_(True),
        )
        .order_by(AssetQuantity.name.asc())
        .all()
    )

    return [
        {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "quantity": item.quantity,
            "available_quantity": item.available_quantity,
            "category_id": item.category_id,
            "category_name": category.category_name,
        }
        for item in quantity_assets
    ]


# =========================================================
# CREATE CATEGORY
# =========================================================

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    return create_category(
        db=db,
        payload=payload,
    )


# =========================================================
# UPDATE CATEGORY
# =========================================================

@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_existing_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(
        db=db,
        category_id=category_id,
    )

    return update_category(
        db=db,
        category=category,
        payload=payload,
    )


# =========================================================
# DELETE CATEGORY
# =========================================================

@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(
        db=db,
        category_id=category_id,
    )

    delete_category(
        db=db,
        category=category,
    )


# =========================================================
# UPSERT CATEGORY REQUIRED QUANTITY
# =========================================================

@router.patch(
    "/{category_id}/require-quantity",
    response_model=CategoryDetailResponse,
)
def upsert_category_require_quantity(
    category_id: int,
    payload: CategoryNeedUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(
        db=db,
        category_id=category_id,
    )

    upsert_category_need(
        db=db,
        category_id=category.id,
        department_id=payload.department_id,
        payload=payload,
    )

    return get_category_or_404(
        db=db,
        category_id=category.id,
    )