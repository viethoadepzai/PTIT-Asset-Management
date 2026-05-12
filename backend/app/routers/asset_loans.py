from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.asset_loan import (
    AssetLoanCancelRequest,
    AssetLoanCreate,
    AssetLoanReceiveRequest,
    AssetLoanResponse,
    AssetLoanReturnRequest,
)
from app.services.asset_loan_service import (
    approve_asset_loan,
    cancel_asset_loan,
    create_asset_loan,
    get_asset_loan_or_404,
    list_asset_loans,
    receive_asset_loan,
    return_asset_loan,
)
from app.services.pdf_service import generate_asset_loan_pdf

router = APIRouter(prefix="/asset-loans", tags=["Asset Loans"])


@router.get("", response_model=list[AssetLoanResponse])
def read_asset_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_asset_loans(db=db, current_user=current_user)


@router.get("/{voucher_id}", response_model=AssetLoanResponse)
def read_asset_loan(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_asset_loan_or_404(
        db=db,
        voucher_id=voucher_id,
        current_user=current_user,
    )


@router.post("", response_model=AssetLoanResponse, status_code=status.HTTP_201_CREATED)
def create_asset_loan_endpoint(
    payload: AssetLoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return create_asset_loan(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{voucher_id}/approve", response_model=AssetLoanResponse)
def approve_asset_loan_endpoint(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return approve_asset_loan(
        db=db,
        voucher_id=voucher_id,
        current_user=current_user,
    )


@router.patch("/{voucher_id}/receive", response_model=AssetLoanResponse)
def receive_asset_loan_endpoint(
    voucher_id: int,
    payload: AssetLoanReceiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return receive_asset_loan(
        db=db,
        voucher_id=voucher_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{voucher_id}/return", response_model=AssetLoanResponse)
def return_asset_loan_endpoint(
    voucher_id: int,
    payload: AssetLoanReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return return_asset_loan(
        db=db,
        voucher_id=voucher_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{voucher_id}/cancel", response_model=AssetLoanResponse)
def cancel_asset_loan_endpoint(
    voucher_id: int,
    payload: AssetLoanCancelRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return cancel_asset_loan(
        db=db,
        voucher_id=voucher_id,
        payload=payload,
    )


@router.get("/{voucher_id}/pdf")
def export_asset_loan_pdf(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    voucher = get_asset_loan_or_404(
        db=db,
        voucher_id=voucher_id,
        current_user=current_user,
    )
    pdf_bytes = generate_asset_loan_pdf(voucher)

    file_name = f"{voucher.voucher_code}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )