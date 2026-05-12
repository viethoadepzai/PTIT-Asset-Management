from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.supply_export import (
    SupplyExportCancelRequest,
    SupplyExportCreate,
    SupplyExportResponse,
)
from app.services.pdf_service import generate_supply_export_pdf
from app.services.supply_export_service import (
    approve_supply_export,
    cancel_supply_export,
    create_supply_export,
    get_supply_export_or_404,
    list_supply_exports,
)

router = APIRouter(prefix="/supply-exports", tags=["Supply Exports"])


@router.get("", response_model=list[SupplyExportResponse])
def read_supply_exports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    return list_supply_exports(db=db, current_user=current_user)


@router.get("/{voucher_id}", response_model=SupplyExportResponse)
def read_supply_export(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    return get_supply_export_or_404(db=db, voucher_id=voucher_id, current_user=current_user)


@router.post(
    "",
    response_model=SupplyExportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_supply_export_endpoint(
    payload: SupplyExportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    return create_supply_export(db=db, payload=payload, current_user=current_user)


@router.patch("/{voucher_id}/approve", response_model=SupplyExportResponse)
def approve_supply_export_endpoint(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return approve_supply_export(db=db, voucher_id=voucher_id, current_user=current_user)


@router.patch("/{voucher_id}/cancel", response_model=SupplyExportResponse)
def cancel_supply_export_endpoint(
    voucher_id: int,
    payload: SupplyExportCancelRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return cancel_supply_export(db=db, voucher_id=voucher_id, payload=payload)


@router.get("/{voucher_id}/pdf")
def export_supply_export_pdf(
    voucher_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    voucher = get_supply_export_or_404(db=db, voucher_id=voucher_id)
    pdf_bytes = generate_supply_export_pdf(voucher)

    file_name = f"{voucher.voucher_code}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{file_name}"'},
    )