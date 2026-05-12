from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.models.asset import Asset
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.asset import AssetCreate, AssetStatusUpdate, AssetUpdate
from app.services.category_needs_service import ensure_category_need


def _apply_asset_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem tài sản cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        xem tài sản được gán cho chính mình
        hoặc được gán cho phòng ban của mình
    - STAFF không có phòng ban:
        chỉ xem tài sản được gán cho chính mình
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                Asset.assigned_user_id == current_user.id,
                Asset.assigned_department_id == current_user.department_id,
            )
        )

    return statement
    # .where(Asset.assigned_user_id == current_user.id)


def get_asset_by_id(
    db: Session,
    asset_id: int,
    current_user: User | None = None,
) -> Asset | None:
    statement = (
        select(Asset)
        .options(
            selectinload(Asset.assigned_department),
            selectinload(Asset.assigned_user),
            selectinload(Asset.category),
        )
        .where(Asset.id == asset_id)
    )

    statement = _apply_asset_visibility_scope(statement, current_user)
    return db.scalar(statement)


def get_asset_by_code(db: Session, asset_code: str) -> Asset | None:
    statement = select(Asset).where(Asset.asset_code == asset_code)
    return db.scalar(statement)


def list_assets(
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
) -> list[Asset]:
    statement = select(Asset).options(
        selectinload(Asset.assigned_department),
        selectinload(Asset.assigned_user),
        selectinload(Asset.category),
    )

    # Giới hạn phạm vi xem của Staff trước
    statement = _apply_asset_visibility_scope(statement, current_user)

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                Asset.asset_code.ilike(normalized_keyword),
                Asset.name.ilike(normalized_keyword),
                Asset.serial_number.ilike(normalized_keyword),
                Asset.location.ilike(normalized_keyword),
            )
        )

    if category_id is not None:
        statement = statement.where(Asset.category_id == category_id)

    if status_filter is not None:
        statement = statement.where(Asset.status == status_filter)

    if condition_filter is not None:
        statement = statement.where(Asset.condition == condition_filter)

    if assigned_department_id is not None:
        statement = statement.where(
            Asset.assigned_department_id == assigned_department_id
        )

    if assigned_user_id is not None:
        statement = statement.where(Asset.assigned_user_id == assigned_user_id)

    if is_active is not None:
        statement = statement.where(Asset.is_active == is_active)

    statement = (
        statement.order_by(Asset.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def create_asset(db: Session, payload: AssetCreate) -> Asset:
    duplicate_conditions = [Asset.asset_code == payload.asset_code.strip()]

    if payload.serial_number:
        duplicate_conditions.append(
            Asset.serial_number == payload.serial_number.strip()
        )

    existing_asset = db.scalar(select(Asset).where(or_(*duplicate_conditions)))
    if existing_asset is not None:
        detail = (
            "Asset code already exists"
            if existing_asset.asset_code == payload.asset_code.strip()
            else "Serial number already exists"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

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

    asset = Asset(
        asset_code=payload.asset_code.strip(),
        name=payload.name.strip(),
        serial_number=payload.serial_number.strip()
        if payload.serial_number
        else None,
        specification=payload.specification.strip()
        if payload.specification
        else None,
        purchase_date=payload.purchase_date,
        useful_life=payload.useful_life,
        purchase_cost=payload.purchase_cost,
        status=payload.status,
        condition=payload.condition,
        location=payload.location.strip() if payload.location else None,
        note=payload.note.strip() if payload.note else None,
        vendor_name=payload.vendor_name.strip() if payload.vendor_name else None,
        category_id=payload.category_id,
        assigned_department_id=assigned_department_id,
        assigned_user_id=assigned_user_id,
        is_active=payload.is_active,
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)


    return get_asset_or_404(db=db, asset_id=asset.id)


def update_asset(db: Session, asset: Asset, payload: AssetUpdate) -> Asset:
    update_data = payload.model_dump(exclude_unset=True)

    if "asset_code" in update_data and update_data["asset_code"] is not None:
        normalized_asset_code = update_data["asset_code"].strip()
        existing = db.scalar(
            select(Asset).where(
                Asset.asset_code == normalized_asset_code,
                Asset.id != asset.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset code already exists",
            )
        asset.asset_code = normalized_asset_code

    if "serial_number" in update_data:
        normalized_serial_number = (
            update_data["serial_number"].strip()
            if update_data["serial_number"]
            else None
        )
        if normalized_serial_number is not None:
            existing = db.scalar(
                select(Asset).where(
                    Asset.serial_number == normalized_serial_number,
                    Asset.id != asset.id,
                )
            )
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Serial number already exists",
                )
        asset.serial_number = normalized_serial_number

    if "name" in update_data and update_data["name"] is not None:
        asset.name = update_data["name"].strip()

    if "specification" in update_data:
        asset.specification = (
            update_data["specification"].strip()
            if update_data["specification"]
            else None
        )

    if "purchase_date" in update_data:
        asset.purchase_date = update_data["purchase_date"]

    if "useful_life" in update_data:
        asset.useful_life = update_data["useful_life"]

    if "purchase_cost" in update_data:
        asset.purchase_cost = update_data["purchase_cost"]

    if "status" in update_data and update_data["status"] is not None:
        asset.status = update_data["status"]

    if "condition" in update_data and update_data["condition"] is not None:
        asset.condition = update_data["condition"]

    if "location" in update_data:
        asset.location = (
            update_data["location"].strip()
            if update_data["location"]
            else None
        )

    if "note" in update_data:
        asset.note = update_data["note"].strip() if update_data["note"] else None

    if "vendor_name" in update_data:
        asset.vendor_name = (
            update_data["vendor_name"].strip()
            if update_data["vendor_name"]
            else None
        )

    if "category_id" in update_data:
        asset.category_id = update_data["category_id"]

    if "assigned_department_id" in update_data:
        assigned_department_id = update_data["assigned_department_id"]
        if assigned_department_id is not None:
            department = db.get(Department, assigned_department_id)
            if department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned department not found",
                )
        asset.assigned_department_id = assigned_department_id

    if "assigned_user_id" in update_data:
        assigned_user_id = update_data["assigned_user_id"]
        if assigned_user_id is not None:
            user = db.get(User, assigned_user_id)
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned user not found",
                )
        asset.assigned_user_id = assigned_user_id

    if "is_active" in update_data and update_data["is_active"] is not None:
        asset.is_active = update_data["is_active"]

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return get_asset_or_404(db=db, asset_id=asset.id)


def update_asset_status(
    db: Session,
    asset: Asset,
    payload: AssetStatusUpdate,
) -> Asset:
    asset.status = payload.status

    if payload.condition is not None:
        asset.condition = payload.condition

    if payload.note is not None:
        asset.note = payload.note.strip() if payload.note else None

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return get_asset_or_404(db=db, asset_id=asset.id)


def deactivate_asset(db: Session, asset: Asset) -> Asset:
    asset.is_active = False
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return get_asset_or_404(db=db, asset_id=asset.id)

def activate_asset(db: Session, asset: Asset) -> Asset:
    asset.is_active = True
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return get_asset_or_404(db=db, asset_id=asset.id)


def get_asset_or_404(
    db: Session,
    asset_id: int,
    current_user: User | None = None,
) -> Asset:
    asset = get_asset_by_id(
        db=db,
        asset_id=asset_id,
        current_user=current_user,
    )
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    return asset
