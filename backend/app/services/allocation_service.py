from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.allocation import Allocation, AllocationStatus, AllocationType
from app.models.asset import Asset, AssetStatus
from app.models.department import Department
from app.models.supply import Supply
from app.models.user import User, UserRole
from app.schemas.allocation import AllocationCreate, AllocationStatusUpdate, AllocationUpdate


def _apply_allocation_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem allocation cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        xem allocation của chính mình hoặc phòng ban mình
    - STAFF không có phòng ban:
        chỉ xem allocation của chính mình
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                Allocation.allocated_user_id == current_user.id,
                Allocation.allocated_department_id == current_user.department_id,
            )
        )

    return statement.where(Allocation.allocated_user_id == current_user.id)


def _ensure_allocation_access(allocation: Allocation, current_user: User) -> None:
    if current_user.role in {UserRole.ADMIN, UserRole.MANAGER}:
        return

    if allocation.allocated_user_id == current_user.id:
        return

    if (
        current_user.department_id is not None
        and allocation.allocated_department_id == current_user.department_id
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this allocation",
    )


def get_allocation_by_id(
    db: Session,
    allocation_id: int,
    current_user: User | None = None,
) -> Allocation | None:
    statement = (
        select(Allocation)
        .options(
            selectinload(Allocation.asset),
            selectinload(Allocation.supply),
            selectinload(Allocation.allocated_department),
            selectinload(Allocation.allocated_user),
            selectinload(Allocation.allocated_by_user),
        )
        .where(Allocation.id == allocation_id)
    )

    statement = _apply_allocation_visibility_scope(statement, current_user)
    return db.scalar(statement)


def list_allocations(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    keyword: str | None = None,
    allocation_type: str | None = None,
    status_filter: str | None = None,
    allocated_department_id: int | None = None,
    allocated_user_id: int | None = None,
    asset_id: int | None = None,
    supply_id: int | None = None,
    is_active: bool | None = None,
    current_user: User | None = None,
) -> list[Allocation]:
    statement = select(Allocation).options(
        selectinload(Allocation.asset),
        selectinload(Allocation.supply),
        selectinload(Allocation.allocated_department),
        selectinload(Allocation.allocated_user),
        selectinload(Allocation.allocated_by_user),
    )

    statement = _apply_allocation_visibility_scope(statement, current_user)

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                Allocation.allocation_code.ilike(normalized_keyword),
                Allocation.purpose.ilike(normalized_keyword),
                Allocation.note.ilike(normalized_keyword),
            )
        )

    if allocation_type is not None:
        statement = statement.where(Allocation.allocation_type == allocation_type)

    if status_filter is not None:
        statement = statement.where(Allocation.status == status_filter)

    if allocated_department_id is not None:
        statement = statement.where(
            Allocation.allocated_department_id == allocated_department_id
        )

    if allocated_user_id is not None:
        statement = statement.where(Allocation.allocated_user_id == allocated_user_id)

    if asset_id is not None:
        statement = statement.where(Allocation.asset_id == asset_id)

    if supply_id is not None:
        statement = statement.where(Allocation.supply_id == supply_id)

    if is_active is not None:
        statement = statement.where(Allocation.is_active == is_active)

    statement = (
        statement.order_by(Allocation.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def create_allocation(
    db: Session,
    payload: AllocationCreate,
    current_user: User,
) -> Allocation:
    existing = db.scalar(
        select(Allocation).where(
            Allocation.allocation_code == payload.allocation_code.strip()
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allocation code already exists",
        )

    # STAFF chỉ được tạo đề nghị cấp phát vật tư cho chính mình / phòng ban mình
    if current_user.role == UserRole.STAFF:
        if payload.allocation_type != AllocationType.SUPPLY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff can only create supply allocation requests",
            )

        supply = db.get(Supply, payload.supply_id)
        if supply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supply not found",
            )
        if not supply.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supply is inactive",
            )

        allocation = Allocation(
            allocation_code=payload.allocation_code.strip(),
            allocation_type=AllocationType.SUPPLY,
            status=AllocationStatus.REQUESTED,
            asset_id=None,
            supply_id=supply.id,
            quantity=payload.quantity,
            allocated_department_id=current_user.department_id,
            allocated_user_id=current_user.id,
            allocated_by_user_id=current_user.id,
            expected_return_date=None,
            purpose=payload.purpose.strip() if payload.purpose else None,
            note=payload.note.strip() if payload.note else None,
            is_active=True,
        )

        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        return get_allocation_or_404(db=db, allocation_id=allocation.id)

    # ADMIN / MANAGER giữ logic cấp phát thật như cũ
    department_id = payload.allocated_department_id
    if department_id is not None:
        department = db.get(Department, department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Allocated department not found",
            )

    allocated_user_id = payload.allocated_user_id
    if allocated_user_id is not None:
        allocated_user = db.get(User, allocated_user_id)
        if allocated_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Allocated user not found",
            )

    asset_id: int | None = None
    supply_id: int | None = None
    quantity = payload.quantity

    if payload.allocation_type == AllocationType.ASSET:
        asset = db.get(Asset, payload.asset_id)
        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found",
            )
        if not asset.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset is inactive",
            )
        if asset.status != AssetStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only available assets can be allocated",
            )

        asset.assigned_department_id = department_id
        asset.assigned_user_id = allocated_user_id
        asset.status = AssetStatus.IN_USE
        db.add(asset)

        asset_id = asset.id
        quantity = Decimal("1")

    else:
        supply = db.get(Supply, payload.supply_id)
        if supply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supply not found",
            )
        if not supply.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supply is inactive",
            )
        if Decimal(str(supply.quantity_in_stock)) < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient quantity in stock",
            )

        supply.quantity_in_stock = Decimal(str(supply.quantity_in_stock)) - payload.quantity
        db.add(supply)
        supply_id = supply.id

    allocation = Allocation(
        allocation_code=payload.allocation_code.strip(),
        allocation_type=payload.allocation_type,
        status=AllocationStatus.ACTIVE,
        asset_id=asset_id,
        supply_id=supply_id,
        quantity=quantity,
        allocated_department_id=department_id,
        allocated_user_id=allocated_user_id,
        allocated_by_user_id=current_user.id,
        expected_return_date=payload.expected_return_date,
        purpose=payload.purpose.strip() if payload.purpose else None,
        note=payload.note.strip() if payload.note else None,
        is_active=payload.is_active,
    )

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return get_allocation_or_404(db=db, allocation_id=allocation.id)


def update_allocation(
    db: Session,
    allocation: Allocation,
    payload: AllocationUpdate,
) -> Allocation:
    if allocation.status != AllocationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active allocations can be updated",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "allocated_department_id" in update_data:
        department_id = update_data["allocated_department_id"]
        if department_id is not None:
            department = db.get(Department, department_id)
            if department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Allocated department not found",
                )
        allocation.allocated_department_id = department_id

        if allocation.asset_id is not None:
            asset = db.get(Asset, allocation.asset_id)
            if asset is not None:
                asset.assigned_department_id = department_id
                db.add(asset)

    if "allocated_user_id" in update_data:
        user_id = update_data["allocated_user_id"]
        if user_id is not None:
            allocated_user = db.get(User, user_id)
            if allocated_user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Allocated user not found",
                )
        allocation.allocated_user_id = user_id

        if allocation.asset_id is not None:
            asset = db.get(Asset, allocation.asset_id)
            if asset is not None:
                asset.assigned_user_id = user_id
                db.add(asset)

    if "expected_return_date" in update_data:
        allocation.expected_return_date = update_data["expected_return_date"]

    if "purpose" in update_data:
        allocation.purpose = (
            update_data["purpose"].strip() if update_data["purpose"] else None
        )

    if "note" in update_data:
        allocation.note = update_data["note"].strip() if update_data["note"] else None

    if "is_active" in update_data and update_data["is_active"] is not None:
        allocation.is_active = update_data["is_active"]

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return get_allocation_or_404(db=db, allocation_id=allocation.id)


def update_allocation_status(
    db: Session,
    allocation: Allocation,
    payload: AllocationStatusUpdate,
    current_user: User,
) -> Allocation:
    _ensure_allocation_access(allocation, current_user)

    # 1) Xử lý yêu cầu Staff đang chờ duyệt
    if allocation.status == AllocationStatus.REQUESTED:
        if current_user.role not in {UserRole.ADMIN, UserRole.MANAGER}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only manager/admin can process requested allocations",
            )

        if allocation.supply_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested allocation must be a supply allocation",
            )

        if payload.status == AllocationStatus.ACTIVE:
            supply = db.get(Supply, allocation.supply_id)
            if supply is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Supply not found",
                )
            if not supply.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supply is inactive",
                )
            if Decimal(str(supply.quantity_in_stock)) < Decimal(str(allocation.quantity)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient quantity in stock",
                )

            supply.quantity_in_stock = Decimal(str(supply.quantity_in_stock)) - Decimal(
                str(allocation.quantity)
            )
            allocation.status = AllocationStatus.ACTIVE

            if payload.note is not None:
                allocation.note = payload.note.strip() if payload.note else None

            db.add(supply)
            db.add(allocation)
            db.commit()
            db.refresh(allocation)

            return get_allocation_or_404(db=db, allocation_id=allocation.id)

        if payload.status == AllocationStatus.CANCELLED:
            allocation.status = AllocationStatus.CANCELLED
            allocation.returned_at = datetime.now(timezone.utc)

            if payload.note is not None:
                allocation.note = payload.note.strip() if payload.note else None

            db.add(allocation)
            db.commit()
            db.refresh(allocation)

            return get_allocation_or_404(db=db, allocation_id=allocation.id)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested allocation can only move to ACTIVE or CANCELLED",
        )

    # 2) Từ đây chỉ xử lý allocation đang ACTIVE
    if allocation.status != AllocationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active allocations can change status",
        )

    # Asset allocation
    if allocation.asset_id is not None:
        if current_user.role == UserRole.STAFF:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff cannot update asset allocation status",
            )

        if payload.status not in {
            AllocationStatus.RETURNED,
            AllocationStatus.CANCELLED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset allocation status must be RETURNED or CANCELLED",
            )

        asset = db.get(Asset, allocation.asset_id)
        if asset is not None:
            asset.status = AssetStatus.AVAILABLE
            asset.assigned_department_id = None
            asset.assigned_user_id = None
            db.add(asset)

        allocation.status = payload.status
        allocation.returned_at = datetime.now(timezone.utc)
        if payload.note is not None:
            allocation.note = payload.note.strip() if payload.note else None

        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        return get_allocation_or_404(db=db, allocation_id=allocation.id)

    # Supply allocation
    if allocation.supply_id is not None:
        if payload.status not in {
            AllocationStatus.COMPLETED,
            AllocationStatus.CANCELLED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supply allocation status must be COMPLETED or CANCELLED",
            )

        if current_user.role == UserRole.STAFF:
            if payload.status != AllocationStatus.COMPLETED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Staff can only confirm completed supply allocation",
                )

        if payload.status == AllocationStatus.CANCELLED:
            supply = db.get(Supply, allocation.supply_id)
            if supply is not None:
                supply.quantity_in_stock = Decimal(str(supply.quantity_in_stock)) + Decimal(
                    str(allocation.quantity)
                )
                db.add(supply)

        allocation.status = payload.status
        allocation.returned_at = datetime.now(timezone.utc)
        if payload.note is not None:
            allocation.note = payload.note.strip() if payload.note else None

        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        return get_allocation_or_404(db=db, allocation_id=allocation.id)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid allocation resource",
    )


def deactivate_allocation(db: Session, allocation: Allocation) -> Allocation:
    allocation.is_active = False
    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return get_allocation_or_404(db=db, allocation_id=allocation.id)


def get_allocation_or_404(
    db: Session,
    allocation_id: int,
    current_user: User | None = None,
) -> Allocation:
    allocation = get_allocation_by_id(
        db=db,
        allocation_id=allocation_id,
        current_user=current_user,
    )
    if allocation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allocation not found",
        )
    return allocation