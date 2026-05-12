from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset, AssetStatus
from app.models.maintenance import (
    Maintenance,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
)
from app.models.user import User, UserRole
from app.models.warranty_ticket import WarrantyStatus, WarrantyTicket
from app.schemas.warranty_ticket import (
    WarrantyCancelRequest,
    WarrantyCompleteRequest,
    WarrantySendRequest,
    WarrantyTicketCreate,
)


def _generate_warranty_code() -> str:
    return f"BH-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def _apply_warranty_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem phiếu bảo hành cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        xem phiếu do mình tạo
        hoặc phiếu liên quan tới tài sản thuộc phòng ban mình
    - STAFF không có phòng ban:
        chỉ xem phiếu do mình tạo
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                WarrantyTicket.created_by_user_id == current_user.id,
                WarrantyTicket.asset.has(
                    Asset.assigned_department_id == current_user.department_id
                ),
            )
        )

    return statement.where(WarrantyTicket.created_by_user_id == current_user.id)


def _ensure_staff_can_request_warranty_for_asset(
    asset: Asset,
    current_user: User,
) -> None:
    """
    STAFF chỉ được tạo yêu cầu bảo hành cho:
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
        detail="You do not have permission to create warranty request for this asset",
    )


def get_warranty_ticket_or_404(
    db: Session,
    ticket_id: int,
    current_user: User | None = None,
) -> WarrantyTicket:
    stmt = (
        select(WarrantyTicket)
        .options(
            selectinload(WarrantyTicket.asset),
            selectinload(WarrantyTicket.maintenance),
            selectinload(WarrantyTicket.created_by_user),
            selectinload(WarrantyTicket.handled_by_user),
        )
        .where(WarrantyTicket.id == ticket_id)
    )

    stmt = _apply_warranty_visibility_scope(stmt, current_user)

    ticket = db.execute(stmt).scalar_one_or_none()
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warranty ticket not found",
        )
    return ticket


def list_warranty_tickets(
    db: Session,
    current_user: User,
) -> list[WarrantyTicket]:
    stmt = (
        select(WarrantyTicket)
        .options(
            selectinload(WarrantyTicket.asset),
            selectinload(WarrantyTicket.maintenance),
            selectinload(WarrantyTicket.created_by_user),
            selectinload(WarrantyTicket.handled_by_user),
        )
        .order_by(WarrantyTicket.created_at.desc())
    )

    stmt = _apply_warranty_visibility_scope(stmt, current_user)

    return list(db.execute(stmt).scalars().all())


def create_warranty_ticket(
    db: Session,
    payload: WarrantyTicketCreate,
    current_user: User,
) -> WarrantyTicket:
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

    _ensure_staff_can_request_warranty_for_asset(asset, current_user)

    ticket = WarrantyTicket(
        warranty_code=_generate_warranty_code(),
        asset_id=payload.asset_id,
        created_by_user_id=current_user.id,
        vendor_name=payload.vendor_name,
        provider_contact=payload.provider_contact,
        warranty_start_date=payload.warranty_start_date,
        warranty_end_date=payload.warranty_end_date,
        sent_date=payload.sent_date,
        expected_return_date=payload.expected_return_date,
        issue_description=payload.issue_description,
        note=payload.note,
        status=WarrantyStatus.DRAFT,
    )
    db.add(ticket)
    db.commit()

    return get_warranty_ticket_or_404(db=db, ticket_id=ticket.id)


def send_warranty_ticket(
    db: Session,
    ticket_id: int,
    payload: WarrantySendRequest,
    current_user: User,
) -> WarrantyTicket:
    ticket = get_warranty_ticket_or_404(db=db, ticket_id=ticket_id)

    if ticket.status != WarrantyStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft tickets can be sent",
        )

    asset = db.get(Asset, ticket.asset_id)
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

    asset.status = AssetStatus.UNDER_MAINTENANCE
    db.add(asset)

    maintenance = Maintenance(
        maintenance_code=f"MT-BH-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        asset_id=asset.id,
        maintenance_type=MaintenanceType.WARRANTY,
        status=MaintenanceStatus.IN_PROGRESS,
        priority=MaintenancePriority.MEDIUM,
        title=f"Bao hanh tai san {asset.name}",
        description=ticket.issue_description,
        scheduled_date=payload.sent_date or ticket.sent_date,
        started_at=datetime.now(),
        vendor_name=ticket.vendor_name,
        reported_by_user_id=ticket.created_by_user_id,
        assigned_to_user_id=current_user.id,
        cost=Decimal("0"),
        resolution_note=None,
        is_active=True,
    )
    db.add(maintenance)
    db.flush()

    ticket.maintenance_id = maintenance.id
    ticket.handled_by_user_id = current_user.id
    ticket.sent_date = payload.sent_date or ticket.sent_date
    ticket.expected_return_date = (
        payload.expected_return_date or ticket.expected_return_date
    )
    ticket.status = WarrantyStatus.SENT
    if payload.note:
        ticket.note = f"{ticket.note or ''}\n[GUI BAO HANH] {payload.note}".strip()
    db.add(ticket)

    db.commit()
    return get_warranty_ticket_or_404(db=db, ticket_id=ticket.id)


def complete_warranty_ticket(
    db: Session,
    ticket_id: int,
    payload: WarrantyCompleteRequest,
) -> WarrantyTicket:
    ticket = get_warranty_ticket_or_404(db=db, ticket_id=ticket_id)

    if ticket.status not in {WarrantyStatus.SENT, WarrantyStatus.PROCESSING}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only sent or processing tickets can be completed",
        )

    asset = db.get(Asset, ticket.asset_id)
    if asset is not None:
        asset.status = AssetStatus.AVAILABLE
        db.add(asset)

    if ticket.maintenance_id is not None:
        maintenance = db.get(Maintenance, ticket.maintenance_id)
        if maintenance is not None:
            maintenance.status = MaintenanceStatus.COMPLETED
            maintenance.completed_at = datetime.now()
            maintenance.resolution_note = payload.resolution_note
            if payload.maintenance_cost is not None:
                maintenance.cost = payload.maintenance_cost
            db.add(maintenance)

    ticket.received_back_date = payload.received_back_date
    ticket.resolution_note = payload.resolution_note
    ticket.status = WarrantyStatus.COMPLETED
    if payload.note:
        ticket.note = (
            f"{ticket.note or ''}\n[HOAN TAT BAO HANH] {payload.note}".strip()
        )
    db.add(ticket)

    db.commit()
    return get_warranty_ticket_or_404(db=db, ticket_id=ticket.id)


def cancel_warranty_ticket(
    db: Session,
    ticket_id: int,
    payload: WarrantyCancelRequest,
) -> WarrantyTicket:
    ticket = get_warranty_ticket_or_404(db=db, ticket_id=ticket_id)

    if ticket.status == WarrantyStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already cancelled",
        )

    if ticket.status == WarrantyStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed ticket cannot be cancelled",
        )

    if ticket.maintenance_id is not None:
        maintenance = db.get(Maintenance, ticket.maintenance_id)
        if maintenance is not None:
            maintenance.status = MaintenanceStatus.CANCELLED
            db.add(maintenance)

    asset = db.get(Asset, ticket.asset_id)
    if asset is not None and asset.status == AssetStatus.UNDER_MAINTENANCE:
        asset.status = AssetStatus.AVAILABLE
        db.add(asset)

    ticket.status = WarrantyStatus.CANCELLED
    if payload.note:
        ticket.note = f"{ticket.note or ''}\n[HUY PHIEU] {payload.note}".strip()
    db.add(ticket)

    db.commit()
    return get_warranty_ticket_or_404(db=db, ticket_id=ticket.id)