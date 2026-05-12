from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity
from app.models.category import Category


def get_asset_needs(db: Session, department_id: int) -> list[dict]:
    """
    Lấy nhu cầu tài sản theo phòng ban.
    Group by category_name thay vì category_id để trả về tên danh mục.
    """
    # Assets grouped by category_id
    asset_rows = db.execute(
        select(
            Category.category_name,
            Category.id.label("category_id"),
            func.count(Asset.id).label("current_qty"),
            func.max(Asset.required_quantity_category).label("required_qty"),
        )
        .join(Category, Asset.category_id == Category.id)
        .where(
            Asset.assigned_department_id == department_id,
            Asset.is_active == True,
            Asset.category_id.isnot(None),
        )
        .group_by(Category.id, Category.category_name)
    ).all()

    # Quantity assets grouped by category_id
    qty_rows = db.execute(
        select(
            Category.category_name,
            Category.id.label("category_id"),
            func.sum(AssetQuantity.available_quantity).label("current_qty"),
            func.max(AssetQuantity.required_quantity_category).label("required_qty"),
        )
        .join(Category, AssetQuantity.category_id == Category.id)
        .where(
            AssetQuantity.assigned_department_id == department_id,
            AssetQuantity.is_active == True,
            AssetQuantity.category_id.isnot(None),
        )
        .group_by(Category.id, Category.category_name)
    ).all()

    results = []
    for row in asset_rows:
        current = row.current_qty or 0
        required = row.required_qty or 5
        results.append({
            "category_id": row.category_id,
            "category": row.category_name,
            "asset_type": "asset",
            "required_quantity_category": required,
            "current_quantity": current,
            "status": _calc_status(current, required),
        })

    for row in qty_rows:
        current = row.current_qty or 0
        required = row.required_qty or 200
        results.append({
            "category_id": row.category_id,
            "category": row.category_name,
            "asset_type": "quantity_asset",
            "required_quantity_category": required,
            "current_quantity": current,
            "status": _calc_status(current, required),
        })

    return sorted(results, key=lambda r: (r["asset_type"], r["category"]))


def _calc_status(current: int, required: int) -> str:
    if current < required:
        return "shortage"
    if current == required:
        return "sufficient"
    return "surplus"


def update_required_quantity_category(
    db: Session,
    department_id: int,
    asset_type: str,
    category_id: int,
    required_quantity_category: int,
) -> int:
    if asset_type == "asset":
        result = db.execute(
            update(Asset)
            .where(
                Asset.category_id == category_id,
                Asset.assigned_department_id == department_id,
            )
            .values(required_quantity_category=required_quantity_category)
        )
    elif asset_type == "quantity_asset":
        result = db.execute(
            update(AssetQuantity)
            .where(
                AssetQuantity.category_id == category_id,
                AssetQuantity.assigned_department_id == department_id,
            )
            .values(required_quantity_category=required_quantity_category)
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="asset_type phải là 'asset' hoặc 'quantity_asset'.",
        )

    db.commit()
    return result.rowcount
