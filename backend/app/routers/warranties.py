from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.warranty_ticket import (
    WarrantyCancelRequest,
    WarrantyCompleteRequest,
    WarrantySendRequest,
    WarrantyTicketCreate,
    WarrantyTicketResponse,
)
from app.services.pdf_service import generate_warranty_ticket_pdf
from app.services.warranty_service import (
    cancel_warranty_ticket,
    complete_warranty_ticket,
    create_warranty_ticket,
    get_warranty_ticket_or_404,
    list_warranty_tickets,
    send_warranty_ticket,
)

router = APIRouter(prefix="/warranties", tags=["Warranties"])


@router.get("", response_model=list[WarrantyTicketResponse])
def read_warranty_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_warranty_tickets(db=db, current_user=current_user)


@router.get("/{ticket_id}", response_model=WarrantyTicketResponse)
def read_warranty_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_warranty_ticket_or_404(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user,
    )


@router.post("", response_model=WarrantyTicketResponse, status_code=status.HTTP_201_CREATED)
def create_warranty_ticket_endpoint(
    payload: WarrantyTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return create_warranty_ticket(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{ticket_id}/send", response_model=WarrantyTicketResponse)
def send_warranty_ticket_endpoint(
    ticket_id: int,
    payload: WarrantySendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return send_warranty_ticket(
        db=db,
        ticket_id=ticket_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch("/{ticket_id}/complete", response_model=WarrantyTicketResponse)
def complete_warranty_ticket_endpoint(
    ticket_id: int,
    payload: WarrantyCompleteRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return complete_warranty_ticket(
        db=db,
        ticket_id=ticket_id,
        payload=payload,
    )


@router.patch("/{ticket_id}/cancel", response_model=WarrantyTicketResponse)
def cancel_warranty_ticket_endpoint(
    ticket_id: int,
    payload: WarrantyCancelRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return cancel_warranty_ticket(
        db=db,
        ticket_id=ticket_id,
        payload=payload,
    )


@router.get("/{ticket_id}/pdf")
def export_warranty_ticket_pdf(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    ticket = get_warranty_ticket_or_404(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user,
    )
    pdf_bytes = generate_warranty_ticket_pdf(ticket)

    file_name = f"{ticket.warranty_code}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )