from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset, AssetStatus
from app.models.maintenance import Maintenance, MaintenanceStatus

from app.models.user import User, UserRole
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceStatusUpdate,
    MaintenanceUpdate,
)


ACTIVE_MAINTENANCE_STATUSES = {
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
}


def _apply_maintenance_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem bảo trì cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        xem yêu cầu do chính mình tạo
        hoặc được giao cho mình
        hoặc liên quan tới tài sản của phòng ban mình
    - STAFF không có phòng ban:
        chỉ xem yêu cầu do mình tạo hoặc được giao cho mình
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                Maintenance.reported_by_user_id == current_user.id,
                Maintenance.assigned_to_user_id == current_user.id,
                Maintenance.asset.has(
                    Asset.assigned_department_id == current_user.department_id
                ),
            )
        )

    return statement.where(
        or_(
            Maintenance.reported_by_user_id == current_user.id,
            Maintenance.assigned_to_user_id == current_user.id,
        )
    )


def _ensure_staff_can_request_maintenance_for_asset(
    asset: Asset,
    current_user: User,
) -> None:
    """
    STAFF chỉ được tạo yêu cầu bảo trì cho:
    - tài sản gán cho chính mình
    - hoặc tài sản của phòng ban mình
    """
    if current_user.role != UserRole.STAFF:
        return

    if asset.assigned_user_id == current_user.id:
        return

    if (
        current_user.department_id is not None
        and asset.assigned_department_id == current_user.department_id
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to create maintenance request for this asset",
    )


def get_maintenance_by_id(
    db: Session,
    maintenance_id: int,
    current_user: User | None = None,
) -> Maintenance | None:
    statement = (
        select(Maintenance)
        .options(
            selectinload(Maintenance.asset),
            selectinload(Maintenance.reported_by_user),
            selectinload(Maintenance.assigned_to_user),
        )
        .where(Maintenance.id == maintenance_id)
    )

    statement = _apply_maintenance_visibility_scope(statement, current_user)
    return db.scalar(statement)


def get_maintenance_or_404(
    db: Session,
    maintenance_id: int,
    current_user: User | None = None,
) -> Maintenance:
    maintenance = get_maintenance_by_id(
        db=db,
        maintenance_id=maintenance_id,
        current_user=current_user,
    )
    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found",
        )
    return maintenance


def list_maintenances(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    keyword: str | None = None,
    asset_id: int | None = None,
    assigned_to_user_id: int | None = None,
    reported_by_user_id: int | None = None,
    maintenance_type: str | None = None,
    priority: str | None = None,
    status_filter: str | None = None,
    is_active: bool | None = None,
    current_user: User | None = None,
) -> list[Maintenance]:
    statement = select(Maintenance).options(
        selectinload(Maintenance.asset),
        selectinload(Maintenance.reported_by_user),
        selectinload(Maintenance.assigned_to_user),
    )

    statement = _apply_maintenance_visibility_scope(statement, current_user)

    if keyword:
        normalized_keyword = f"%{keyword.strip()}%"
        statement = statement.where(
            or_(
                Maintenance.maintenance_code.ilike(normalized_keyword),
                Maintenance.title.ilike(normalized_keyword),
                Maintenance.description.ilike(normalized_keyword),
                Maintenance.vendor_name.ilike(normalized_keyword),
            )
        )

    if asset_id is not None:
        statement = statement.where(Maintenance.asset_id == asset_id)

    if assigned_to_user_id is not None:
        statement = statement.where(
            Maintenance.assigned_to_user_id == assigned_to_user_id
        )

    if reported_by_user_id is not None:
        statement = statement.where(
            Maintenance.reported_by_user_id == reported_by_user_id
        )

    if maintenance_type is not None:
        statement = statement.where(Maintenance.maintenance_type == maintenance_type)

    if priority is not None:
        statement = statement.where(Maintenance.priority == priority)

    if status_filter is not None:
        statement = statement.where(Maintenance.status == status_filter)

    if is_active is not None:
        statement = statement.where(Maintenance.is_active == is_active)

    statement = (
        statement.order_by(Maintenance.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def _validate_asset_exists(db: Session, asset_id: int) -> Asset:
    asset = db.get(Asset, asset_id)
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
    return asset


def _validate_user_exists(
    db: Session,
    user_id: int | None,
    *,
    field_name: str,
) -> int | None:
    if user_id is None:
        return None

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{field_name} not found",
        )
    return user.id


def _ensure_unique_maintenance_code(
    db: Session,
    maintenance_code: str,
    *,
    exclude_id: int | None = None,
) -> str:
    normalized_code = maintenance_code.strip()
    statement = select(Maintenance).where(
        Maintenance.maintenance_code == normalized_code
    )

    if exclude_id is not None:
        statement = statement.where(Maintenance.id != exclude_id)

    existing = db.scalar(statement)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance code already exists",
        )
    return normalized_code


def _apply_asset_status_for_maintenance(
    asset: Asset,
    maintenance_status: MaintenanceStatus,
) -> None:
    if maintenance_status in ACTIVE_MAINTENANCE_STATUSES:
        asset.status = AssetStatus.UNDER_MAINTENANCE
    elif maintenance_status in {
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.CANCELLED,
    }:
        if asset.status == AssetStatus.UNDER_MAINTENANCE:
            asset.status = AssetStatus.AVAILABLE


def create_maintenance(
    db: Session,
    payload: MaintenanceCreate,
    current_user: User,
) -> Maintenance:
    maintenance_code = _ensure_unique_maintenance_code(db, payload.maintenance_code)
    asset = _validate_asset_exists(db, payload.asset_id)

    # Staff chỉ được gửi yêu cầu cho tài sản thuộc phạm vi của mình
    _ensure_staff_can_request_maintenance_for_asset(asset, current_user)

    if current_user.role == UserRole.STAFF:
        effective_status = MaintenanceStatus.SCHEDULED
        effective_assigned_to_user_id = None
        effective_cost = None
        effective_resolution_note = None
        effective_next_maintenance_date = None
    else:
        effective_status = payload.status
        effective_assigned_to_user_id = _validate_user_exists(
            db,
            payload.assigned_to_user_id,
            field_name="Assigned user",
        )
        effective_cost = payload.cost
        effective_resolution_note = payload.resolution_note
        effective_next_maintenance_date = payload.next_maintenance_date

    maintenance = Maintenance(
        maintenance_code=maintenance_code,
        asset_id=asset.id,
        maintenance_type=payload.maintenance_type,
        status=effective_status,
        priority=payload.priority,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        scheduled_date=payload.scheduled_date,
        next_maintenance_date=effective_next_maintenance_date,
        cost=effective_cost,
        vendor_name=payload.vendor_name.strip() if payload.vendor_name else None,
        resolution_note=effective_resolution_note.strip()
        if effective_resolution_note
        else None,
        reported_by_user_id=current_user.id,
        assigned_to_user_id=effective_assigned_to_user_id,
        is_active=payload.is_active,
    )

    if effective_status == MaintenanceStatus.IN_PROGRESS:
        maintenance.started_at = datetime.now(timezone.utc)

    if effective_status == MaintenanceStatus.COMPLETED:
        maintenance.completed_at = datetime.now(timezone.utc)

    # Staff tạo "yêu cầu" thì chưa đổi trạng thái asset
    if current_user.role != UserRole.STAFF:
        _apply_asset_status_for_maintenance(asset, effective_status)
        db.add(asset)

    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)

    return get_maintenance_or_404(db=db, maintenance_id=maintenance.id)


def update_maintenance(
    db: Session,
    maintenance: Maintenance,
    payload: MaintenanceUpdate,
) -> Maintenance:
    update_data = payload.model_dump(exclude_unset=True)

    if "maintenance_code" in update_data and update_data["maintenance_code"] is not None:
        maintenance.maintenance_code = _ensure_unique_maintenance_code(
            db,
            update_data["maintenance_code"],
            exclude_id=maintenance.id,
        )

    if "maintenance_type" in update_data and update_data["maintenance_type"] is not None:
        maintenance.maintenance_type = update_data["maintenance_type"]

    if "priority" in update_data and update_data["priority"] is not None:
        maintenance.priority = update_data["priority"]

    if "title" in update_data and update_data["title"] is not None:
        maintenance.title = update_data["title"].strip()

    if "description" in update_data:
        maintenance.description = (
            update_data["description"].strip()
            if update_data["description"]
            else None
        )

    if "scheduled_date" in update_data:
        maintenance.scheduled_date = update_data["scheduled_date"]

    if "next_maintenance_date" in update_data:
        maintenance.next_maintenance_date = update_data["next_maintenance_date"]

    if "cost" in update_data:
        maintenance.cost = update_data["cost"]

    if "vendor_name" in update_data:
        maintenance.vendor_name = (
            update_data["vendor_name"].strip()
            if update_data["vendor_name"]
            else None
        )

    if "resolution_note" in update_data:
        maintenance.resolution_note = (
            update_data["resolution_note"].strip()
            if update_data["resolution_note"]
            else None
        )

    if "assigned_to_user_id" in update_data:
        maintenance.assigned_to_user_id = _validate_user_exists(
            db,
            update_data["assigned_to_user_id"],
            field_name="Assigned user",
        )

    if "is_active" in update_data and update_data["is_active"] is not None:
        maintenance.is_active = update_data["is_active"]

    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)
    return get_maintenance_or_404(db=db, maintenance_id=maintenance.id)


def update_maintenance_status(
    db: Session,
    maintenance: Maintenance,
    payload: MaintenanceStatusUpdate,
) -> Maintenance:
    asset = _validate_asset_exists(db, maintenance.asset_id)
    next_status = payload.status

    if (
        maintenance.status == MaintenanceStatus.COMPLETED
        and next_status != MaintenanceStatus.COMPLETED
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed maintenance cannot be reopened",
        )

    if (
        maintenance.status == MaintenanceStatus.CANCELLED
        and next_status != MaintenanceStatus.CANCELLED
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled maintenance cannot be reopened",
        )

    maintenance.status = next_status

    if next_status == MaintenanceStatus.IN_PROGRESS and maintenance.started_at is None:
        maintenance.started_at = datetime.now(timezone.utc)

    if next_status == MaintenanceStatus.COMPLETED:
        maintenance.completed_at = datetime.now(timezone.utc)
    elif next_status != MaintenanceStatus.COMPLETED:
        maintenance.completed_at = None

    if payload.resolution_note is not None:
        maintenance.resolution_note = (
            payload.resolution_note.strip()
            if payload.resolution_note
            else None
        )

    if payload.cost is not None:
        maintenance.cost = payload.cost

    if payload.next_maintenance_date is not None:
        maintenance.next_maintenance_date = payload.next_maintenance_date

    _apply_asset_status_for_maintenance(asset, next_status)

    db.add(asset)
    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)
    return get_maintenance_or_404(db=db, maintenance_id=maintenance.id)


def deactivate_maintenance(db: Session, maintenance: Maintenance) -> Maintenance:
    maintenance.is_active = False
    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)

    return get_maintenance_or_404(db=db, maintenance_id=maintenance.id)
