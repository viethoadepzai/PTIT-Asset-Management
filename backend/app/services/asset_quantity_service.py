from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset_quantity import AssetQuantity, QuantityAssetApprovalStatus
from app.models.category import Category
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.asset_quantity import (
    AssetQuantityCreate,
    AssetQuantityStatusUpdate,
    AssetQuantityUpdate,
)
from app.services.category_needs_service import ensure_category_need
from app.services.location_quantity_asset_service import create_kho_location


def _apply_asset_quantity_visibility_scope(statement, current_user: User | None):
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                AssetQuantity.assigned_user_id == current_user.id,
                AssetQuantity.assigned_department_id == current_user.department_id,
            )
        )

    return statement.where(AssetQuantity.assigned_user_id == current_user.id)


def get_asset_quantity_by_id(
    db: Session,
    asset_quantity_id: int,
    current_user: User | None = None,
    ) -> AssetQuantity | None:
    statement = (
        select(AssetQuantity)
        .options(
            selectinload(AssetQuantity.assigned_department),
            selectinload(AssetQuantity.assigned_user),
            selectinload(AssetQuantity.category),
        )
        .where(AssetQuantity.id == asset_quantity_id)
    )

    statement = _apply_asset_quantity_visibility_scope(statement, current_user)
    return db.scalar(statement)


def list_asset_quantities(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    keyword: str | None = None,
    category_id: int | None = None,
    status_filter: str | None = None,
    condition_filter: str | None = None,
    assigned_department_id: int | None = None,
    assigned_user_id: int | None = None,
    is_active: bool | None = None,
    current_user: User | None = None,
    ) -> list[AssetQuantity]:
    statement = select(AssetQuantity).options(
        selectinload(AssetQuantity.assigned_department),
        selectinload(AssetQuantity.assigned_user),
        selectinload(AssetQuantity.category),
    ).outerjoin(Category, AssetQuantity.category_id == Category.id)

    statement = _apply_asset_quantity_visibility_scope(statement, current_user)

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                AssetQuantity.name.ilike(normalized_keyword),
                AssetQuantity.code.ilike(normalized_keyword),
                AssetQuantity.serial_number.ilike(normalized_keyword),
                AssetQuantity.location.ilike(normalized_keyword),
                func.lower(Category.category_name).ilike(normalized_keyword),
            )
        )

    if category_id is not None:
        statement = statement.where(AssetQuantity.category_id == category_id)

    if status_filter is not None:
        statement = statement.where(AssetQuantity.status == status_filter)

    if condition_filter is not None:
        statement = statement.where(AssetQuantity.condition == condition_filter)

    if assigned_department_id is not None:
        statement = statement.where(
            AssetQuantity.assigned_department_id == assigned_department_id
        )

    if assigned_user_id is not None:
        statement = statement.where(AssetQuantity.assigned_user_id == assigned_user_id)

    if is_active is not None:
        statement = statement.where(AssetQuantity.is_active == is_active)

    statement = statement.order_by(AssetQuantity.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def create_asset_quantity(
    db: Session, payload: AssetQuantityCreate, current_user: User | None = None
    ) -> AssetQuantity:
    print("payload: ", payload);
    assigned_department_id = payload.assigned_department_id
    if assigned_department_id is not None:
        department = db.get(Department, assigned_department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned department not found",
            )

    assigned_user_id = payload.assigned_user_id
    if assigned_user_id is not None:
        user = db.get(User, assigned_user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found",
            )

    normalized_quantity = payload.quantity
    normalized_available_quantity = (
        payload.available_quantity
        if payload.available_quantity is not None
        else normalized_quantity
    )
    if normalized_available_quantity > normalized_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_quantity must be less than or equal to quantity",
        )

    is_admin = current_user is not None and current_user.role == UserRole.ADMIN
    approval_status = (
        QuantityAssetApprovalStatus.APPROVED if is_admin else QuantityAssetApprovalStatus.PENDING
    )
    is_active = is_admin

    asset_quantity = AssetQuantity(
        code=payload.code.strip(),
        name=payload.name.strip(),
        quantity=normalized_quantity,
        available_quantity=normalized_available_quantity,
        serial_number=payload.serial_number.strip() if payload.serial_number else None,
        specification=payload.specification.strip() if payload.specification else None,
        purchase_date=payload.purchase_date,
        useful_life=payload.useful_life,
        purchase_cost=payload.purchase_cost,
        status=payload.status,
        condition=payload.condition,
        location=payload.location.strip() if payload.location else None,
        note=payload.note.strip() if payload.note else None,
        category_id=payload.category_id,
        assigned_department_id=assigned_department_id,
        assigned_user_id=assigned_user_id,
        is_active=is_active,
        approval_status=approval_status,
        required_quantity_category=payload.required_quantity_category,
    )

    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    asset_quantity.qr_value = f"http://localhost:8000/api/v1/asset-quantities/{asset_quantity.id}"
    db.commit()
    db.refresh(asset_quantity)

    if is_admin:
        create_kho_location(db=db, quantity_assets_id=asset_quantity.id, lot_quantity=normalized_quantity)


    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def update_asset_quantity(
    db: Session, asset_quantity: AssetQuantity, payload: AssetQuantityUpdate
) -> AssetQuantity:
    update_data = payload.model_dump(exclude_unset=True)

    next_quantity = asset_quantity.quantity
    next_available_quantity = asset_quantity.available_quantity

    if "code" in update_data and update_data["code"] is not None:
        asset_quantity.code = update_data["code"].strip()

    if "name" in update_data and update_data["name"] is not None:
        asset_quantity.name = update_data["name"].strip()

    if "quantity" in update_data and update_data["quantity"] is not None:
        next_quantity = update_data["quantity"]

    if "useful_life" in update_data and update_data["useful_life"] is not None:
        asset_quantity.useful_life = update_data["useful_life"]

    if (
        "available_quantity" in update_data
        and update_data["available_quantity"] is not None
    ):
        next_available_quantity = update_data["available_quantity"]

    if next_available_quantity > next_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_quantity must be less than or equal to quantity",
        )
    asset_quantity.quantity = next_quantity
    asset_quantity.available_quantity = next_available_quantity

    if "category_id" in update_data:
        asset_quantity.category_id = update_data["category_id"]

    if "specification" in update_data:
        asset_quantity.specification = (
            update_data["specification"].strip() if update_data["specification"] else None
        )

    if "purchase_date" in update_data:
        asset_quantity.purchase_date = update_data["purchase_date"]

    if "purchase_cost" in update_data:
        asset_quantity.purchase_cost = update_data["purchase_cost"]

    if "status" in update_data and update_data["status"] is not None:
        asset_quantity.status = update_data["status"]

    if "condition" in update_data and update_data["condition"] is not None:
        asset_quantity.condition = update_data["condition"]

    if "location" in update_data:
        asset_quantity.location = (
            update_data["location"].strip() if update_data["location"] else None
        )

    if "note" in update_data:
        asset_quantity.note = update_data["note"].strip() if update_data["note"] else None

    if "assigned_department_id" in update_data:
        assigned_department_id = update_data["assigned_department_id"]
        if assigned_department_id is not None:
            department = db.get(Department, assigned_department_id)
            if department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned department not found",
                )
        asset_quantity.assigned_department_id = assigned_department_id

    if "assigned_user_id" in update_data:
        assigned_user_id = update_data["assigned_user_id"]
        if assigned_user_id is not None:
            user = db.get(User, assigned_user_id)
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned user not found",
                )
        asset_quantity.assigned_user_id = assigned_user_id

    if "is_active" in update_data and update_data["is_active"] is not None:
        asset_quantity.is_active = update_data["is_active"]

    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def update_asset_quantity_status(
    db: Session, asset_quantity: AssetQuantity, payload: AssetQuantityStatusUpdate
) -> AssetQuantity:
    asset_quantity.status = payload.status

    if payload.condition is not None:
        asset_quantity.condition = payload.condition

    if payload.note is not None:
        asset_quantity.note = payload.note.strip() if payload.note else None

    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)

def deactivate_asset_quantity(db: Session, asset_quantity: AssetQuantity) -> AssetQuantity:
    asset_quantity.is_active = False
    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def activate_asset_quantity(db: Session, asset_quantity: AssetQuantity) -> AssetQuantity:
    asset_quantity.is_active = True
    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def approve_asset_quantity(db: Session, asset_quantity: AssetQuantity) -> AssetQuantity:
    if asset_quantity.approval_status == QuantityAssetApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lô tài sản đã được duyệt rồi.",
        )
    asset_quantity.approval_status = QuantityAssetApprovalStatus.APPROVED
    asset_quantity.is_active = True
    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)

    create_kho_location(db=db, quantity_assets_id=asset_quantity.id, lot_quantity=asset_quantity.quantity)
    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def reject_asset_quantity(db: Session, asset_quantity: AssetQuantity) -> AssetQuantity:
    if asset_quantity.approval_status == QuantityAssetApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể từ chối lô tài sản đã được duyệt.",
        )
    asset_quantity.approval_status = QuantityAssetApprovalStatus.REJECTED
    asset_quantity.is_active = False
    db.add(asset_quantity)
    db.commit()
    db.refresh(asset_quantity)
    return get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity.id)


def get_asset_quantity_or_404(
    db: Session,
    asset_quantity_id: int,
    current_user: User | None = None,
) -> AssetQuantity:
    asset_quantity = get_asset_quantity_by_id(
        db=db,
        asset_quantity_id=asset_quantity_id,
        current_user=current_user,
    )
    if asset_quantity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset quantity not found",
        )
    return asset_quantity
