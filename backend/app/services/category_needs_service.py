from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity
from app.models.category import Category, CategoryNeed, CategoryNeedStatus
from app.models.supply import Supply
from app.models.user import User, UserRole
from app.models.location_quantity_asset import LocationQuantityAsset
from app.schemas.category import CategoryNeedCreate, CategoryNeedUpdate


# =========================================================
# QUERY HELPERS
# =========================================================

def _need_load_options():
    """Danh sách selectinload dùng chung."""
    return [
        selectinload(CategoryNeed.category).selectinload(Category.quantity_assets),
        selectinload(CategoryNeed.department),
        selectinload(CategoryNeed.asset_quantity),
        selectinload(CategoryNeed.created_by_user),
        selectinload(CategoryNeed.approved_by_user),
    ]


def get_category_need_by_id(
    db: Session,
    category_need_id: int,
) -> CategoryNeed | None:
    statement = (
        select(CategoryNeed)
        .options(*_need_load_options())
        .where(CategoryNeed.id == category_need_id)
    )
    return db.scalar(statement)


def get_category_need_or_404(
    db: Session,
    category_need_id: int,
) -> CategoryNeed:
    need = get_category_need_by_id(db, category_need_id)
    if need is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nhu cầu danh mục không tồn tại.",
        )
    return need


# =========================================================
# STOCK CALCULATION
# =========================================================

def _get_current_quantity(
    db: Session,
    category_id: int,
    category_type: str,
    asset_quantity_id: int | None,
) -> int:
    """Tính tổng số lượng khả dụng của tài sản/vật tư trong KHO TỔNG.

    - Loại 'asset' → lấy available_quantity của AssetQuantity tương ứng (nếu có)
    - Loại 'supply' → lấy quantity_in_stock của Supply tương ứng (nếu có logic supply riêng)
    """
    total = 0

    if category_type == "asset" and asset_quantity_id is not None:
        qty = db.execute(
            select(AssetQuantity.available_quantity).where(
                AssetQuantity.id == asset_quantity_id,
                AssetQuantity.is_active == True,
            )
        ).scalar()
        if qty is not None:
            total += int(qty)

    elif category_type == "supply":
        # Tạm thời nếu supply chưa có id riêng trong phiếu nhu cầu, ta tổng hợp của category đó
        qty_sum = db.execute(
            select(func.coalesce(func.sum(Supply.quantity_in_stock), 0)).where(
                Supply.category_id == category_id,
                Supply.is_active == True,
            )
        ).scalar() or 0
        total += int(float(qty_sum))

    return total


# =========================================================
# PERMISSION HELPERS
# =========================================================

def _ensure_can_modify(need: CategoryNeed, current_user: User) -> None:
    """Chỉ cho phép sửa/xóa phiếu ở trạng thái draft.
    Manager chỉ sửa phiếu do mình tạo.
    """
    if need.status != CategoryNeedStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể sửa phiếu ở trạng thái '{need.status.value}'. "
                   f"Chỉ phiếu nháp (draft) mới được sửa.",
        )

    if current_user.role == UserRole.MANAGER:
        if need.created_by_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager chỉ được sửa phiếu do mình tạo.",
            )


# =========================================================
# ENSURE CATEGORY NEED
# =========================================================

def ensure_category_need(
    db: Session,
    category_id: int,
    department_id: int | None,
    detail: str | None = None,
) -> CategoryNeed | None:
    """Tạo CategoryNeed nếu chưa tồn tại với category_id và department_id.

    Trả về None nếu category_id hoặc department_id là None (không tạo).
    """
    if category_id is None or department_id is None:
        return None

    existing = db.execute(
        select(CategoryNeed).where(
            CategoryNeed.category_id == category_id,
            CategoryNeed.department_id == department_id,
            CategoryNeed.detail == detail,
        )
    ).scalar_one_or_none()

    if existing is not None:
        return existing

    need = CategoryNeed(
        category_id=category_id,
        department_id=department_id,
        require_quantity=0,
        detail="",
        is_active=True,
        status=CategoryNeedStatus.DRAFT,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    return need


# =========================================================
# LIST
# =========================================================

def list_category_needs(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 200,
    department_id: int | None = None,
    category_id: int | None = None,
    detail: str | None = None,
    is_active: bool | None = None,
    need_status: str | None = None,
    created_by_user_id: int | None = None,
) -> list[dict]:
    statement = (
        select(CategoryNeed)
        .options(*_need_load_options())
        .offset(skip)
        .limit(limit)
        .order_by(CategoryNeed.id.desc())
    )

    if department_id is not None:
        statement = statement.where(CategoryNeed.department_id == department_id)
    if category_id is not None:
        statement = statement.where(CategoryNeed.category_id == category_id)
    if detail is not None:
        statement = statement.where(CategoryNeed.detail == detail)
    if is_active is not None:
        statement = statement.where(CategoryNeed.is_active == is_active)
    if need_status is not None:
        statement = statement.where(CategoryNeed.status == need_status)
    if created_by_user_id is not None:
        statement = statement.where(CategoryNeed.created_by_user_id == created_by_user_id)

    needs = list(db.scalars(statement).all())
    results = []
    for need in needs:
        current_qty = _get_current_quantity(
            db, need.category_id, need.category.category_type, need.asset_quantity_id
        )
        results.append({
            "need": need,
            "current_quantity": current_qty,
        })
    return results


# =========================================================
# CREATE
# =========================================================

def create_category_need(
    db: Session,
    payload: CategoryNeedCreate,
    current_user: User,
) -> tuple[CategoryNeed, int]:
    
    final_department_id = payload.department_id
    if current_user.role == UserRole.MANAGER and current_user.department_id:
        final_department_id = current_user.department_id

    need = CategoryNeed(
        category_id=payload.category_id,
        department_id=final_department_id,
        asset_quantity_id=payload.asset_quantity_id,
        require_quantity=payload.require_quantity,
        detail=payload.detail,
        is_active=True,
        status=CategoryNeedStatus.DRAFT,
        created_by_user_id=current_user.id,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    current_qty = _get_current_quantity(
        db, need.category_id, need.category.category_type, need.asset_quantity_id
    )
    return need, current_qty


# =========================================================
# UPDATE
# =========================================================

def update_category_need(
    db: Session,
    category_need: CategoryNeed,
    payload: CategoryNeedUpdate,
    current_user: User,
) -> tuple[CategoryNeed, int]:
    _ensure_can_modify(category_need, current_user)

    if current_user.role == UserRole.MANAGER and current_user.department_id:
        category_need.department_id = current_user.department_id
    elif payload.department_id is not None:
        category_need.department_id = payload.department_id
        
    if payload.asset_quantity_id is not None:
        category_need.asset_quantity_id = payload.asset_quantity_id
    if payload.require_quantity is not None:
        category_need.require_quantity = payload.require_quantity
    if payload.detail is not None:
        category_need.detail = payload.detail
    if payload.is_active is not None:
        category_need.is_active = payload.is_active

    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    current_qty = _get_current_quantity(
        db,
        category_need.category_id,
        category_need.category.category_type,
        category_need.asset_quantity_id,
    )
    return category_need, current_qty


# =========================================================
# DELETE
# =========================================================

def delete_category_need(
    db: Session,
    category_need: CategoryNeed,
    current_user: User,
) -> None:
    _ensure_can_modify(category_need, current_user)
    db.delete(category_need)
    db.commit()


# =========================================================
# WORKFLOW: SUBMIT
# =========================================================

def submit_category_need(
    db: Session,
    category_need: CategoryNeed,
    current_user: User,
) -> CategoryNeed:
    """Draft → Submitted."""
    if category_need.status != CategoryNeedStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ phiếu nháp (draft) mới được gửi duyệt.",
        )

    if current_user.role == UserRole.MANAGER:
        if category_need.created_by_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager chỉ được gửi duyệt phiếu do mình tạo.",
            )

    category_need.status = CategoryNeedStatus.SUBMITTED
    category_need.submitted_at = datetime.now(timezone.utc)

    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    return category_need


# =========================================================
# WORKFLOW: APPROVE
# =========================================================

def approve_category_need(
    db: Session,
    category_need: CategoryNeed,
    current_user: User,
) -> CategoryNeed:
    """Submitted → Approved (chỉ Admin). Kèm trừ tồn kho."""
    if category_need.status != CategoryNeedStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ phiếu đã gửi duyệt (submitted) mới được phê duyệt.",
        )

    # Trừ tồn kho trước khi duyệt
    if category_need.asset_quantity_id:
        asset_qty = db.scalar(
            select(AssetQuantity).where(AssetQuantity.id == category_need.asset_quantity_id)
        )
        if not asset_qty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tài sản trong kho để cấp.",
            )
        if asset_qty.available_quantity < category_need.require_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tồn kho không đủ. Yêu cầu: {category_need.require_quantity}, "
                       f"Hiện có: {asset_qty.available_quantity}",
            )
        asset_qty.available_quantity -= category_need.require_quantity
        db.add(asset_qty)
        
        kho = db.scalar(
            select(LocationQuantityAsset).where(
                LocationQuantityAsset.quantity_assets_id == asset_qty.id,
                LocationQuantityAsset.room_code == "KHO",
            )
        )
        if kho:
            kho.quantity -= category_need.require_quantity
            db.add(kho)

        # -------------------------------------------------
        # Cập nhật bảng phân bổ tài sản cho phòng ban
        # Cộng dồn: lần 1 = 500, lần 2 = 300 → tổng = 800
        # -------------------------------------------------
        if category_need.department_id:
            from app.models.department_quantity_asset_allocation import (
                DepartmentQuantityAssetAllocation,
            )

            allocation = db.scalar(
                select(DepartmentQuantityAssetAllocation).where(
                    DepartmentQuantityAssetAllocation.department_id == category_need.department_id,
                    DepartmentQuantityAssetAllocation.quantity_asset_id == category_need.asset_quantity_id,
                )
            )
            if allocation:
                # Đã có bản ghi → cộng dồn số lượng
                allocation.allocated_quantity += category_need.require_quantity
                db.add(allocation)
            else:
                # Chưa có → tạo mới
                allocation = DepartmentQuantityAssetAllocation(
                    department_id=category_need.department_id,
                    quantity_asset_id=category_need.asset_quantity_id,
                    allocated_quantity=category_need.require_quantity,
                    notes=f"Từ phiếu nhu cầu #{category_need.id}",
                )
                db.add(allocation)

    category_need.status = CategoryNeedStatus.APPROVED
    category_need.approved_at = datetime.now(timezone.utc)
    category_need.approved_by_user_id = current_user.id

    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    return category_need


# =========================================================
# WORKFLOW: REJECT
# =========================================================

def reject_category_need(
    db: Session,
    category_need: CategoryNeed,
    current_user: User,
    rejected_reason: str,
) -> CategoryNeed:
    """Submitted → Rejected (chỉ Admin)."""
    if category_need.status != CategoryNeedStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ phiếu đã gửi duyệt (submitted) mới được từ chối.",
        )

    category_need.status = CategoryNeedStatus.REJECTED
    category_need.rejected_reason = rejected_reason
    category_need.approved_by_user_id = current_user.id

    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    return category_need


# =========================================================
# WORKFLOW: CANCEL
# =========================================================

def cancel_category_need(
    db: Session,
    category_need: CategoryNeed,
    current_user: User,
) -> CategoryNeed:
    """Draft/Submitted → Cancelled."""
    if category_need.status not in (
        CategoryNeedStatus.DRAFT,
        CategoryNeedStatus.SUBMITTED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ phiếu nháp hoặc đã gửi mới được hủy.",
        )

    if current_user.role == UserRole.MANAGER:
        if category_need.created_by_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager chỉ được hủy phiếu do mình tạo.",
            )

    category_need.status = CategoryNeedStatus.CANCELLED

    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    return category_need
