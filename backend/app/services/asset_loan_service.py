from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset, AssetStatus
from app.models.asset_loan_item import AssetLoanItem
from app.models.asset_loan_voucher import AssetLoanStatus, AssetLoanVoucher
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.asset_loan import (
    AssetLoanCancelRequest,
    AssetLoanCreate,
    AssetLoanReceiveRequest,
    AssetLoanReturnRequest,
)


def _generate_asset_loan_code() -> str:
    return f"PM-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def _apply_asset_loan_visibility_scope(statement, current_user: User | None):
    """
    Giới hạn phạm vi xem phiếu mượn cho STAFF.

    - ADMIN / MANAGER: không giới hạn
    - STAFF có phòng ban:
        xem phiếu của chính mình hoặc của phòng ban mình
    - STAFF không có phòng ban:
        chỉ xem phiếu của chính mình
    """
    if current_user is None:
        return statement

    if current_user.role != UserRole.STAFF:
        return statement

    if current_user.department_id is not None:
        return statement.where(
            or_(
                AssetLoanVoucher.borrower_user_id == current_user.id,
                AssetLoanVoucher.borrower_department_id == current_user.department_id,
            )
        )

    return statement.where(AssetLoanVoucher.borrower_user_id == current_user.id)


def _ensure_asset_loan_access(voucher: AssetLoanVoucher, current_user: User) -> None:
    """
    Kiểm tra STAFF có quyền thao tác trên phiếu không.
    """
    if current_user.role in {UserRole.ADMIN, UserRole.MANAGER}:
        return

    if voucher.borrower_user_id == current_user.id:
        return

    if (
        current_user.department_id is not None
        and voucher.borrower_department_id == current_user.department_id
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this voucher",
    )


def get_asset_loan_or_404(
    db: Session,
    voucher_id: int,
    current_user: User | None = None,
) -> AssetLoanVoucher:
    stmt = (
        select(AssetLoanVoucher)
        .options(
            selectinload(AssetLoanVoucher.items),
            selectinload(AssetLoanVoucher.borrower_department),
            selectinload(AssetLoanVoucher.borrower_user),
            selectinload(AssetLoanVoucher.approved_by_user),
        )
        .where(AssetLoanVoucher.id == voucher_id)
    )

    stmt = _apply_asset_loan_visibility_scope(stmt, current_user)

    voucher = db.execute(stmt).scalar_one_or_none()
    if voucher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset loan voucher not found",
        )
    return voucher


def list_asset_loans(
    db: Session,
    current_user: User,
) -> list[AssetLoanVoucher]:
    stmt = (
        select(AssetLoanVoucher)
        .options(
            selectinload(AssetLoanVoucher.items),
            selectinload(AssetLoanVoucher.borrower_department),
            selectinload(AssetLoanVoucher.borrower_user),
            selectinload(AssetLoanVoucher.approved_by_user),
        )
        .order_by(AssetLoanVoucher.created_at.desc())
    )

    stmt = _apply_asset_loan_visibility_scope(stmt, current_user)

    return list(db.execute(stmt).scalars().all())


def create_asset_loan(
    db: Session,
    payload: AssetLoanCreate,
    current_user: User,
) -> AssetLoanVoucher:
    # STAFF chỉ được tạo phiếu cho chính mình / phòng ban mình
    if current_user.role == UserRole.STAFF:
        borrower_department_id = current_user.department_id
        borrower_user_id = current_user.id
    else:
        borrower_department_id = payload.borrower_department_id
        borrower_user_id = payload.borrower_user_id

    if borrower_department_id is not None:
        department = db.get(Department, borrower_department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Borrower department not found",
            )

    if borrower_user_id is not None:
        borrower_user = db.get(User, borrower_user_id)
        if borrower_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Borrower user not found",
            )

    voucher = AssetLoanVoucher(
        voucher_code=_generate_asset_loan_code(),
        borrower_department_id=borrower_department_id,
        borrower_user_id=borrower_user_id,
        loan_date=payload.loan_date,
        expected_return_date=payload.expected_return_date,
        purpose=payload.purpose,
        note=payload.note,
        status=AssetLoanStatus.DRAFT,
    )
    db.add(voucher)
    db.flush()

    for item_payload in payload.items:
        asset = db.get(Asset, item_payload.asset_id)
        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with id={item_payload.asset_id} not found",
            )

        item = AssetLoanItem(
            voucher_id=voucher.id,
            asset_id=asset.id,
            asset_code_snapshot=asset.asset_code,
            asset_name_snapshot=asset.name,
            condition_before_snapshot=asset.condition.value,
            note=item_payload.note,
        )
        db.add(item)

    db.commit()
    return get_asset_loan_or_404(db=db, voucher_id=voucher.id)


def approve_asset_loan(
    db: Session,
    voucher_id: int,
    current_user: User,
) -> AssetLoanVoucher:
    voucher = get_asset_loan_or_404(db=db, voucher_id=voucher_id)

    if voucher.status != AssetLoanStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft vouchers can be approved",
        )

    if not voucher.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voucher has no items",
        )

    for item in voucher.items:
        if item.asset_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{item.asset_name_snapshot}' has no valid asset reference",
            )

        asset = db.get(Asset, item.asset_id)
        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{item.asset_name_snapshot}' not found",
            )

        if not asset.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Asset '{asset.name}' is inactive",
            )

        if asset.status != AssetStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Asset '{asset.name}' is not available",
            )

    for item in voucher.items:
        asset = db.get(Asset, item.asset_id)
        asset.status = AssetStatus.IN_USE
        asset.assigned_department_id = voucher.borrower_department_id
        asset.assigned_user_id = voucher.borrower_user_id
        db.add(asset)

    voucher.status = AssetLoanStatus.APPROVED
    voucher.approved_by_user_id = current_user.id
    db.add(voucher)

    db.commit()
    return get_asset_loan_or_404(db=db, voucher_id=voucher.id)


def receive_asset_loan(
    db: Session,
    voucher_id: int,
    payload: AssetLoanReceiveRequest,
    current_user: User,
) -> AssetLoanVoucher:
    voucher = get_asset_loan_or_404(db=db, voucher_id=voucher_id)
    _ensure_asset_loan_access(voucher, current_user)

    if voucher.status != AssetLoanStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved vouchers can be marked as received",
        )

    voucher.status = AssetLoanStatus.RECEIVED
    if payload.note:
        voucher.note = f"{voucher.note or ''}\n[DA NHAN TAI SAN] {payload.note}".strip()

    db.add(voucher)
    db.commit()

    return get_asset_loan_or_404(db=db, voucher_id=voucher.id)


def return_asset_loan(
    db: Session,
    voucher_id: int,
    payload: AssetLoanReturnRequest,
    current_user: User,
) -> AssetLoanVoucher:
    voucher = get_asset_loan_or_404(db=db, voucher_id=voucher_id)
    _ensure_asset_loan_access(voucher, current_user)

    if voucher.status not in {AssetLoanStatus.APPROVED, AssetLoanStatus.RECEIVED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved or received vouchers can be returned",
        )

    item_map = {item.id: item for item in voucher.items}

    for item_payload in payload.items:
        item = item_map.get(item_payload.item_id)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Loan item with id={item_payload.item_id} not found in this voucher",
            )

        item.condition_after_return = item_payload.condition_after_return
        if item_payload.note:
            item.note = item_payload.note
        db.add(item)

    for item in voucher.items:
        if item.asset_id is None:
            continue

        asset = db.get(Asset, item.asset_id)
        if asset is None:
            continue

        asset.status = AssetStatus.AVAILABLE
        asset.assigned_department_id = None
        asset.assigned_user_id = None
        db.add(asset)

    voucher.actual_return_date = payload.actual_return_date
    voucher.status = AssetLoanStatus.RETURNED
    if payload.note:
        voucher.note = f"{voucher.note or ''}\n[TRA TAI SAN] {payload.note}".strip()

    db.add(voucher)
    db.commit()

    return get_asset_loan_or_404(db=db, voucher_id=voucher.id)


def cancel_asset_loan(
    db: Session,
    voucher_id: int,
    payload: AssetLoanCancelRequest,
) -> AssetLoanVoucher:
    voucher = get_asset_loan_or_404(db=db, voucher_id=voucher_id)

    if voucher.status == AssetLoanStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voucher is already cancelled",
        )

    if voucher.status == AssetLoanStatus.RETURNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Returned voucher cannot be cancelled",
        )

    if voucher.status in {AssetLoanStatus.APPROVED, AssetLoanStatus.RECEIVED}:
        for item in voucher.items:
            if item.asset_id is None:
                continue

            asset = db.get(Asset, item.asset_id)
            if asset is None:
                continue

            asset.status = AssetStatus.AVAILABLE
            asset.assigned_department_id = None
            asset.assigned_user_id = None
            db.add(asset)

    voucher.status = AssetLoanStatus.CANCELLED
    if payload.note:
        voucher.note = f"{voucher.note or ''}\n[HUY PHIEU] {payload.note}".strip()

    db.add(voucher)
    db.commit()

    return get_asset_loan_or_404(db=db, voucher_id=voucher.id)