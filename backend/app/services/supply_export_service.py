from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.department import Department
from app.models.supply import Supply
from app.models.supply_export_item import SupplyExportItem
from app.models.supply_export_voucher import SupplyExportStatus, SupplyExportVoucher
from app.models.user import User, UserRole
from app.schemas.supply_export import SupplyExportCancelRequest, SupplyExportCreate


def _generate_voucher_code() -> str:
    return f"PX-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def _apply_scope_for_staff(stmt, current_user: User):
    if current_user.role == UserRole.STAFF:
        return stmt.where(
            or_(
                SupplyExportVoucher.created_by_user_id == current_user.id,
                SupplyExportVoucher.recipient_department_id == current_user.department_id,
            )
        )
    return stmt


def get_supply_export_or_404(
    db: Session,
    voucher_id: int,
    current_user: User | None = None,
) -> SupplyExportVoucher:
    stmt = (
        select(SupplyExportVoucher)
        .options(
            selectinload(SupplyExportVoucher.items),
            selectinload(SupplyExportVoucher.recipient_department),
            selectinload(SupplyExportVoucher.created_by_user),
            selectinload(SupplyExportVoucher.approved_by_user),
        )
        .where(SupplyExportVoucher.id == voucher_id)
    )
    if current_user is not None:
        stmt = _apply_scope_for_staff(stmt, current_user)
    voucher = db.execute(stmt).scalar_one_or_none()
    if voucher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply export voucher not found",
        )
    return voucher


def list_supply_exports(db: Session, current_user: User) -> list[SupplyExportVoucher]:
    stmt = (
        select(SupplyExportVoucher)
        .options(
            selectinload(SupplyExportVoucher.items),
            selectinload(SupplyExportVoucher.recipient_department),
            selectinload(SupplyExportVoucher.created_by_user),
            selectinload(SupplyExportVoucher.approved_by_user),
        )
        .order_by(SupplyExportVoucher.created_at.desc())
    )
    stmt = _apply_scope_for_staff(stmt, current_user)
    return list(db.execute(stmt).scalars().all())


def create_supply_export(
    db: Session,
    payload: SupplyExportCreate,
    current_user: User,
) -> SupplyExportVoucher:
    if payload.recipient_department_id is not None:
        department = db.get(Department, payload.recipient_department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient department not found",
            )
    if current_user.role == UserRole.STAFF:
        if current_user.department_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff must belong to a department to create supply export vouchers",
            )
        if (
            payload.recipient_department_id is not None
            and payload.recipient_department_id != current_user.department_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff can only create vouchers for their own department",
            )


    voucher = SupplyExportVoucher(
        voucher_code=_generate_voucher_code(),
        export_date=datetime.now(timezone.utc),
        recipient_department_id=payload.recipient_department_id or current_user.department_id,
        created_by_user_id=current_user.id,
        reason=payload.reason,
        note=payload.note,
        status=SupplyExportStatus.DRAFT,
        total_quantity=Decimal("0"),
        total_amount=Decimal("0"),
    )
    db.add(voucher)
    db.flush()

    total_quantity = Decimal("0")
    total_amount = Decimal("0")

    for item_payload in payload.items:
        supply = db.get(Supply, item_payload.supply_id)
        if supply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supply with id={item_payload.supply_id} not found",
            )
        if not supply.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Supply '{supply.name}' is inactive",
            )

        quantity = Decimal(str(item_payload.quantity))
        unit_price = Decimal(str(supply.unit_price or 0))
        line_total = quantity * unit_price

        item = SupplyExportItem(
            voucher_id=voucher.id,
            supply_id=supply.id,
            supply_code_snapshot=supply.supply_code,
            supply_name_snapshot=supply.name,
            unit_snapshot=supply.unit,
            quantity=quantity,
            unit_price=unit_price,
            line_total=line_total,
            note=item_payload.note,
        )
        db.add(item)

        total_quantity += quantity
        total_amount += line_total

    voucher.total_quantity = total_quantity
    voucher.total_amount = total_amount
    db.add(voucher)

    db.commit()
    return get_supply_export_or_404(db, voucher.id, current_user=current_user)


def approve_supply_export(
    db: Session,
    voucher_id: int,
    current_user: User,
) -> SupplyExportVoucher:
    voucher = get_supply_export_or_404(db, voucher_id)

    if voucher.status != SupplyExportStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft vouchers can be approved",
        )

    if not voucher.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voucher has no items",
        )

    # validate tồn kho trước
    for item in voucher.items:
        if item.supply_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{item.supply_name_snapshot}' has no valid supply reference",
            )

        supply = db.get(Supply, item.supply_id)
        if supply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supply for item '{item.supply_name_snapshot}' not found",
            )

        if not supply.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Supply '{supply.name}' is inactive",
            )

        if Decimal(str(supply.quantity_in_stock)) < Decimal(str(item.quantity)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for supply '{supply.name}'",
            )

    # trừ kho sau khi validate xong toàn bộ
    for item in voucher.items:
        supply = db.get(Supply, item.supply_id)
        supply.quantity_in_stock = Decimal(str(supply.quantity_in_stock)) - Decimal(str(item.quantity))
        db.add(supply)

    voucher.status = SupplyExportStatus.APPROVED
    voucher.approved_by_user_id = current_user.id
    db.add(voucher)

    db.commit()
    return get_supply_export_or_404(db, voucher.id)


def cancel_supply_export(
    db: Session,
    voucher_id: int,
    payload: SupplyExportCancelRequest,
) -> SupplyExportVoucher:
    voucher = get_supply_export_or_404(db, voucher_id)

    if voucher.status == SupplyExportStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voucher is already cancelled",
        )

    if voucher.status == SupplyExportStatus.APPROVED:
        for item in voucher.items:
            if item.supply_id is None:
                continue
            supply = db.get(Supply, item.supply_id)
            if supply is None:
                continue
            supply.quantity_in_stock = Decimal(str(supply.quantity_in_stock)) + Decimal(str(item.quantity))
            db.add(supply)

    voucher.status = SupplyExportStatus.CANCELLED

    if payload.note:
        voucher.note = f"{voucher.note or ''}\n[HUY PHIEU] {payload.note}".strip()

    db.add(voucher)
    db.commit()
    return get_supply_export_or_404(db, voucher.id)