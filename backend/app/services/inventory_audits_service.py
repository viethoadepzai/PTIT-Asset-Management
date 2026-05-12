from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department_quantity_asset_allocation import (
    DepartmentQuantityAssetAllocation,
)
from app.models.inventory_audit import (
    InventoryAudit,
    InventoryAuditItem,
    InventoryAuditStatus,
)
from app.models.user import User, UserRole
from app.schemas.inventory_audit import (
    InventoryAuditCreate,
    InventoryAuditItemUpdate,
    InventoryAuditUpdate,
)


def get_audit_or_404(db: Session, audit_id: int) -> InventoryAudit:
    audit = db.get(InventoryAudit, audit_id)
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đợt kiểm kê ID = {audit_id}",
        )
    return audit


def list_audits(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    department_id: int | None = None,
    audit_status: str | None = None,
):
    stmt = select(InventoryAudit).order_by(InventoryAudit.id.desc()).offset(skip).limit(limit)

    if department_id is not None:
        stmt = stmt.where(InventoryAudit.department_id == department_id)
    if audit_status is not None:
        stmt = stmt.where(InventoryAudit.status == audit_status)

    return list(db.scalars(stmt).all())


def create_audit(
    db: Session,
    payload: InventoryAuditCreate,
    current_user: User,
) -> InventoryAudit:
    # 1. Create audit
    new_audit = InventoryAudit(
        code=payload.code.strip(),
        department_id=payload.department_id,
        scheduled_date=payload.scheduled_date,
        assigned_to_user_id=payload.assigned_to_user_id,
        created_by_user_id=current_user.id,
        status=InventoryAuditStatus.SCHEDULED,
    )
    db.add(new_audit)
    db.flush()

    # 2. Quét bảng department_quantity_asset_allocations để tự động tạo chi tiết
    allocations = list(
        db.scalars(
            select(DepartmentQuantityAssetAllocation).where(
                DepartmentQuantityAssetAllocation.department_id == payload.department_id,
                DepartmentQuantityAssetAllocation.allocated_quantity > 0,
            )
        ).all()
    )

    for alloc in allocations:
        item = InventoryAuditItem(
            audit_id=new_audit.id,
            quantity_asset_id=alloc.quantity_asset_id,
            expected_quantity=alloc.allocated_quantity,
            actual_quantity=0,
            damaged_quantity=0,
            notes=None,
        )
        db.add(item)

    db.commit()
    db.refresh(new_audit)
    return new_audit


def update_audit(
    db: Session,
    audit: InventoryAudit,
    payload: InventoryAuditUpdate,
    current_user: User,
) -> InventoryAudit:
    if audit.status != InventoryAuditStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể cập nhật đợt kiểm kê đang ở trạng thái SCHEDULED.",
        )

    if payload.scheduled_date is not None:
        audit.scheduled_date = payload.scheduled_date
    if payload.assigned_to_user_id is not None:
        audit.assigned_to_user_id = payload.assigned_to_user_id

    db.commit()
    db.refresh(audit)
    return audit


def get_audit_items(db: Session, audit_id: int):
    stmt = select(InventoryAuditItem).where(InventoryAuditItem.audit_id == audit_id)
    return list(db.scalars(stmt).all())


def bulk_update_audit_items(
    db: Session,
    audit: InventoryAudit,
    payloads: list[InventoryAuditItemUpdate],
    current_user: User,
):
    if audit.status != InventoryAuditStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể nhập số liệu khi đợt kiểm kê đang ở trạng thái IN_PROGRESS.",
        )

    # Nếu current_user không phải admin/manager, chỉ người được giao mới được cập nhật
    if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
        if audit.assigned_to_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không được phân công kiểm kê đợt này.",
            )

    item_map = {item.id: item for item in audit.items}

    for p in payloads:
        if p.id in item_map:
            item = item_map[p.id]
            item.actual_quantity = p.actual_quantity
            item.damaged_quantity = p.damaged_quantity
            item.notes = p.notes

    db.commit()


# =========================================================
# WORKFLOW LOGIC
# =========================================================

def start_audit(db: Session, audit: InventoryAudit, current_user: User):
    if audit.status != InventoryAuditStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ đợt kiểm kê SCHEDULED mới có thể BẮT ĐẦU.",
        )
    audit.status = InventoryAuditStatus.IN_PROGRESS
    db.commit()


def submit_audit(db: Session, audit: InventoryAudit, current_user: User):
    if audit.status != InventoryAuditStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ đợt kiểm kê IN_PROGRESS mới có thể NỘP.",
        )
    audit.status = InventoryAuditStatus.SUBMITTED
    db.commit()


def approve_audit(db: Session, audit: InventoryAudit, current_user: User):
    if audit.status != InventoryAuditStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ đợt kiểm kê SUBMITTED mới có thể DUYỆT.",
        )
    audit.status = InventoryAuditStatus.APPROVED
    audit.approved_by_user_id = current_user.id
    db.commit()


def complete_audit(db: Session, audit: InventoryAudit, current_user: User):
    if audit.status != InventoryAuditStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ đợt kiểm kê APPROVED mới có thể HOÀN TẤT.",
        )

    # Logic chốt kiểm kê: Cập nhật allocated_quantity
    for item in audit.items:
        alloc = db.scalar(
            select(DepartmentQuantityAssetAllocation).where(
                DepartmentQuantityAssetAllocation.department_id == audit.department_id,
                DepartmentQuantityAssetAllocation.quantity_asset_id == item.quantity_asset_id,
            )
        )
        if alloc:
            alloc.allocated_quantity = item.actual_quantity
            db.add(alloc)

    audit.status = InventoryAuditStatus.COMPLETED
    audit.completed_at = datetime.now(timezone.utc)
    db.commit()


def cancel_audit(db: Session, audit: InventoryAudit, current_user: User):
    if audit.status in (InventoryAuditStatus.COMPLETED, InventoryAuditStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể hủy đợt kiểm kê đã hoàn tất hoặc đã hủy.",
        )
    audit.status = InventoryAuditStatus.CANCELLED
    db.commit()
