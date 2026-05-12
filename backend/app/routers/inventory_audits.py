from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.inventory_audit import (
    InventoryAuditCreate,
    InventoryAuditDetailResponse,
    InventoryAuditItemResponse,
    InventoryAuditItemUpdate,
    InventoryAuditResponse,
    InventoryAuditUpdate,
)
from app.services import inventory_audits_service

router = APIRouter(
    prefix="/inventory-audits",
    tags=["Inventory Audits"],
)


def _map_audit_response(audit) -> dict[str, Any]:
    return {
        "id": audit.id,
        "code": audit.code,
        "department_id": audit.department_id,
        "scheduled_date": audit.scheduled_date,
        "status": audit.status.value if hasattr(audit.status, "value") else str(audit.status),
        "assigned_to_user_id": audit.assigned_to_user_id,
        "created_by_user_id": audit.created_by_user_id,
        "approved_by_user_id": audit.approved_by_user_id,
        "completed_at": audit.completed_at,
        "created_at": audit.created_at,
        "updated_at": audit.updated_at,
        "department_name": audit.department.name if audit.department else None,
        "department_code": audit.department.code if audit.department else None,
        "assigned_to_user_name": audit.assigned_to_user.full_name if audit.assigned_to_user else None,
        "created_by_user_name": audit.created_by_user.full_name if audit.created_by_user else None,
        "approved_by_user_name": audit.approved_by_user.full_name if audit.approved_by_user else None,
    }


def _map_item_response(item) -> dict[str, Any]:
    return {
        "id": item.id,
        "audit_id": item.audit_id,
        "quantity_asset_id": item.quantity_asset_id,
        "expected_quantity": item.expected_quantity,
        "actual_quantity": item.actual_quantity,
        "damaged_quantity": item.damaged_quantity,
        "notes": item.notes,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "quantity_asset_name": item.quantity_asset.name if item.quantity_asset else None,
        "quantity_asset_code": item.quantity_asset.code if item.quantity_asset else None,
    }


@router.get("", response_model=list[InventoryAuditResponse])
def get_inventory_audits(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
    department_id: int | None = Query(default=None, ge=1),
    audit_status: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    audits = inventory_audits_service.list_audits(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
        department_id=department_id,
        audit_status=audit_status,
    )
    return [_map_audit_response(a) for a in audits]


@router.get("/{audit_id}", response_model=InventoryAuditDetailResponse)
def get_inventory_audit_detail(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    
    # Kiểm tra quyền
    if current_user.role != UserRole.ADMIN:
        if audit.department_id != current_user.department_id and audit.assigned_to_user_id != current_user.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập đợt kiểm kê này.")

    resp = _map_audit_response(audit)
    resp["items"] = [_map_item_response(i) for i in audit.items]
    return resp


@router.post("", response_model=InventoryAuditResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_audit(
    payload: InventoryAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    audit = inventory_audits_service.create_audit(db, payload, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}", response_model=InventoryAuditResponse)
def update_inventory_audit(
    audit_id: int,
    payload: InventoryAuditUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    audit = inventory_audits_service.update_audit(db, audit, payload, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}/items", response_model=InventoryAuditDetailResponse)
def bulk_update_items(
    audit_id: int,
    payloads: list[InventoryAuditItemUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.bulk_update_audit_items(db, audit, payloads, current_user)
    
    # Reload để trả về detail mới
    db.refresh(audit)
    resp = _map_audit_response(audit)
    resp["items"] = [_map_item_response(i) for i in audit.items]
    return resp


# =========================================================
# WORKFLOW ROUTES
# =========================================================

@router.patch("/{audit_id}/start", response_model=InventoryAuditResponse)
def start_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.start_audit(db, audit, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}/submit", response_model=InventoryAuditResponse)
def submit_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.submit_audit(db, audit, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}/approve", response_model=InventoryAuditResponse)
def approve_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.approve_audit(db, audit, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}/complete", response_model=InventoryAuditResponse)
def complete_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.complete_audit(db, audit, current_user)
    return _map_audit_response(audit)


@router.patch("/{audit_id}/cancel", response_model=InventoryAuditResponse)
def cancel_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    audit = inventory_audits_service.get_audit_or_404(db, audit_id)
    inventory_audits_service.cancel_audit(db, audit, current_user)
    return _map_audit_response(audit)
