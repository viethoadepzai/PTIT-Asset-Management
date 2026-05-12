from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category
from app.models.department import Department
from app.models.supply import Supply
from app.models.user import User, UserRole
from app.schemas.supply import SupplyCreate, SupplyStockUpdate, SupplyUpdate
from app.services.category_needs_service import ensure_category_need


def _apply_supply_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem vật tư cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        chỉ xem vật tư do phòng ban của mình quản lý
    - STAFF không có phòng ban:
        không xem được vật tư nào
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is None:
        return statement.where(Supply.id == -1)

    return statement.where(
        Supply.managed_department_id == current_user.department_id
    )


def get_supply_by_id(
    db: Session,
    supply_id: int,
    current_user: User | None = None,
) -> Supply | None:
    statement = (
        select(Supply)
        .options(selectinload(Supply.managed_department), selectinload(Supply.category))
        .where(Supply.id == supply_id)
    )

    statement = _apply_supply_visibility_scope(statement, current_user)
    return db.scalar(statement)


def get_supply_by_code(db: Session, supply_code: str) -> Supply | None:
    statement = select(Supply).where(Supply.supply_code == supply_code)
    return db.scalar(statement)


def list_supplies(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    keyword: str | None = None,
    category_id: int | None = None,
    managed_department_id: int | None = None,
    low_stock_only: bool = False,
    is_active: bool | None = None,
    current_user: User | None = None,
) -> list[Supply]:
    statement = select(Supply).options(
        selectinload(Supply.managed_department),
        selectinload(Supply.category),
    ).outerjoin(Category, Supply.category_id == Category.id)

    # Giới hạn phạm vi xem của Staff trước
    statement = _apply_supply_visibility_scope(statement, current_user)

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                Supply.supply_code.ilike(normalized_keyword),
                Supply.name.ilike(normalized_keyword),
                Supply.location.ilike(normalized_keyword),
                func.lower(Category.category_name).ilike(normalized_keyword),
            )
        )

    if category_id is not None:
        statement = statement.where(Supply.category_id == category_id)

    if managed_department_id is not None:
        statement = statement.where(
            Supply.managed_department_id == managed_department_id
        )

    if low_stock_only:
        statement = statement.where(
            Supply.quantity_in_stock <= Supply.minimum_stock_level
        )

    if is_active is not None:
        statement = statement.where(Supply.is_active == is_active)

    statement = (
        statement.order_by(Supply.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def create_supply(db: Session, payload: SupplyCreate) -> Supply:
    existing_supply = get_supply_by_code(
        db=db,
        supply_code=payload.supply_code.strip(),
    )
    if existing_supply is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supply code already exists",
        )

    managed_department_id = payload.managed_department_id
    if managed_department_id is not None:
        department = db.get(Department, managed_department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Managed department not found",
            )

    supply = Supply(
        supply_code=payload.supply_code.strip(),
        name=payload.name.strip(),
        unit=payload.unit.strip(),
        quantity_in_stock=payload.quantity_in_stock,
        minimum_stock_level=payload.minimum_stock_level,
        unit_price=payload.unit_price,
        location=payload.location.strip() if payload.location else None,
        description=payload.description.strip()
        if payload.description
        else None,
        note=payload.note.strip() if payload.note else None,
        category_id=payload.category_id,
        managed_department_id=managed_department_id,
        is_active=payload.is_active,
    )

    db.add(supply)
    db.commit()
    db.refresh(supply)


    return get_supply_or_404(db=db, supply_id=supply.id)


def update_supply(db: Session, supply: Supply, payload: SupplyUpdate) -> Supply:
    update_data = payload.model_dump(exclude_unset=True)

    if "supply_code" in update_data and update_data["supply_code"] is not None:
        normalized_supply_code = update_data["supply_code"].strip()
        existing = db.scalar(
            select(Supply).where(
                Supply.supply_code == normalized_supply_code,
                Supply.id != supply.id,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supply code already exists",
            )
        supply.supply_code = normalized_supply_code

    if "name" in update_data and update_data["name"] is not None:
        supply.name = update_data["name"].strip()

    if "unit" in update_data and update_data["unit"] is not None:
        supply.unit = update_data["unit"].strip()

    if (
        "quantity_in_stock" in update_data
        and update_data["quantity_in_stock"] is not None
    ):
        supply.quantity_in_stock = update_data["quantity_in_stock"]

    if (
        "minimum_stock_level" in update_data
        and update_data["minimum_stock_level"] is not None
    ):
        supply.minimum_stock_level = update_data["minimum_stock_level"]

    if "unit_price" in update_data:
        supply.unit_price = update_data["unit_price"]

    if "location" in update_data:
        supply.location = (
            update_data["location"].strip()
            if update_data["location"]
            else None
        )

    if "description" in update_data:
        supply.description = (
            update_data["description"].strip()
            if update_data["description"]
            else None
        )

    if "note" in update_data:
        supply.note = update_data["note"].strip() if update_data["note"] else None

    if "category_id" in update_data:
        supply.category_id = update_data["category_id"]

    if "managed_department_id" in update_data:
        managed_department_id = update_data["managed_department_id"]
        if managed_department_id is not None:
            department = db.get(Department, managed_department_id)
            if department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Managed department not found",
                )
        supply.managed_department_id = managed_department_id

    if "is_active" in update_data and update_data["is_active"] is not None:
        supply.is_active = update_data["is_active"]

    db.add(supply)
    db.commit()
    db.refresh(supply)

    return get_supply_or_404(db=db, supply_id=supply.id)


def update_supply_stock(
    db: Session,
    supply: Supply,
    payload: SupplyStockUpdate,
) -> Supply:
    new_quantity = Decimal(str(supply.quantity_in_stock)) + payload.quantity_change
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity in stock cannot be negative",
        )

    supply.quantity_in_stock = new_quantity

    if payload.note is not None:
        supply.note = payload.note.strip() if payload.note else None

    db.add(supply)
    db.commit()
    db.refresh(supply)

    return get_supply_or_404(db=db, supply_id=supply.id)


def deactivate_supply(db: Session, supply: Supply) -> Supply:
    supply.is_active = False
    db.add(supply)
    db.commit()
    db.refresh(supply)

    return get_supply_or_404(db=db, supply_id=supply.id)

def activate_supply(db: Session, supply: Supply) -> Supply:
    supply.is_active = True
    db.add(supply)
    db.commit()
    db.refresh(supply)

    return get_supply_or_404(db=db, supply_id=supply.id)


def get_supply_or_404(
    db: Session,
    supply_id: int,
    current_user: User | None = None,
) -> Supply:
    supply = get_supply_by_id(
        db=db,
        supply_id=supply_id,
        current_user=current_user,
    )
    if supply is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply not found",
        )
    return supply