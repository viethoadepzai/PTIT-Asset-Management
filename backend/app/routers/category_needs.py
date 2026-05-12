from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_active_user,
    require_roles,
)
from app.models.user import User, UserRole
from app.schemas.category import (
    CategoryNeedCreate,
    CategoryNeedRejectPayload,
    CategoryNeedUpdate,
)
from app.services.category_needs_service import (
    approve_category_need,
    cancel_category_need,
    create_category_need,
    delete_category_need,
    get_category_need_or_404,
    list_category_needs,
    reject_category_need,
    submit_category_need,
    update_category_need,
)

router = APIRouter(
    prefix="/category-needs",
    tags=["Category Needs"],
)


# =========================================================
# RESPONSE SCHEMA
# =========================================================

class CategoryNeedDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    category_id: int
    department_id: int | None = None
    asset_quantity_id: int | None = None

    require_quantity: int

    detail: str | None = None

    is_active: bool

    # Workflow fields
    status: str = "draft"

    created_by_user_id: int | None = None
    created_by_user_name: str | None = None

    submitted_at: datetime | None = None

    approved_at: datetime | None = None
    approved_by_user_id: int | None = None
    approved_by_user_name: str | None = None

    rejected_reason: str | None = None

    created_at: datetime
    updated_at: datetime

    current_quantity: int = 0

    category_name: str | None = None
    category_code: str | None = None
    category_type: str | None = None

    department_name: str | None = None
    department_code: str | None = None

    asset_quantity_name: str | None = None

    # Danh sách item thuộc category
    quantity_assets: list[dict] = []


# =========================================================
# MAPPER
# =========================================================

def _map_to_response(
    need,
    current_quantity: int,
) -> CategoryNeedDetailResponse:

    quantity_assets = []

    if need.category:
        quantity_assets = [
            {
                "id": item.id,
                "name": item.name,
                "code": item.code,
                "quantity": item.quantity,
                "available_quantity": item.available_quantity,
            }
            for item in need.category.quantity_assets
            if item.is_active
        ]

    return CategoryNeedDetailResponse(
        id=need.id,

        category_id=need.category_id,
        department_id=need.department_id,
        asset_quantity_id=need.asset_quantity_id,

        require_quantity=need.require_quantity,

        detail=need.detail,

        is_active=need.is_active,

        # Workflow
        status=need.status.value
        if hasattr(need.status, "value")
        else str(need.status),

        created_by_user_id=need.created_by_user_id,
        created_by_user_name=need.created_by_user.full_name
        if need.created_by_user
        else None,

        submitted_at=need.submitted_at,

        approved_at=need.approved_at,
        approved_by_user_id=need.approved_by_user_id,
        approved_by_user_name=need.approved_by_user.full_name
        if need.approved_by_user
        else None,

        rejected_reason=need.rejected_reason,

        created_at=need.created_at,
        updated_at=need.updated_at,

        current_quantity=current_quantity,

        category_name=need.category.category_name
        if need.category
        else None,

        category_code=need.category.category_code
        if need.category
        else None,

        category_type=need.category.category_type
        if need.category
        else None,

        department_name=need.department.name
        if need.department
        else None,

        department_code=need.department.code
        if need.department
        else None,

        asset_quantity_name=need.asset_quantity.name
        if need.asset_quantity
        else None,

        quantity_assets=quantity_assets,
    )


# =========================================================
# GET ALL CATEGORY NEEDS
# =========================================================

@router.get(
    "",
    response_model=list[CategoryNeedDetailResponse],
)
def read_category_needs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),

    department_id: int | None = Query(
        default=None,
        ge=1,
    ),

    category_id: int | None = Query(
        default=None,
        ge=1,
    ),

    is_active: bool | None = Query(
        default=None,
    ),

    need_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(draft|submitted|approved|rejected|cancelled)$",
    ),

    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):

    results = list_category_needs(
        db=db,
        skip=skip,
        limit=limit,
        department_id=department_id,
        category_id=category_id,
        is_active=is_active,
        need_status=need_status,
    )

    return [
        _map_to_response(
            r["need"],
            r["current_quantity"],
        )
        for r in results
    ]


# =========================================================
# CREATE CATEGORY NEED
# =========================================================

@router.post(
    "",
    response_model=CategoryNeedDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_category_need(
    payload: CategoryNeedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):

    need, current_qty = create_category_need(
        db=db,
        payload=payload,
        current_user=current_user,
    )

    need = get_category_need_or_404(
        db=db,
        category_need_id=need.id,
    )

    return _map_to_response(
        need,
        current_qty,
    )


# =========================================================
# UPDATE CATEGORY NEED
# =========================================================

@router.patch(
    "/{category_need_id}",
    response_model=CategoryNeedDetailResponse,
)
def update_existing_category_need(
    category_need_id: int,
    payload: CategoryNeedUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    """
    Update category need.

    Chỉ phiếu ở trạng thái draft mới được sửa.
    Manager chỉ sửa phiếu do mình tạo.
    """

    existing_need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    updated_need, current_qty = update_category_need(
        db=db,
        category_need=existing_need,
        payload=payload,
        current_user=current_user,
    )

    refreshed_need = get_category_need_or_404(
        db=db,
        category_need_id=updated_need.id,
    )

    return _map_to_response(
        refreshed_need,
        current_qty,
    )


# =========================================================
# DELETE CATEGORY NEED
# =========================================================

@router.delete(
    "/{category_need_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_category_need(
    category_need_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    """
    Xóa phiếu nhu cầu.

    Chỉ phiếu ở trạng thái draft mới được xóa.
    Manager chỉ xóa phiếu do mình tạo.
    """

    need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    delete_category_need(
        db=db,
        category_need=need,
        current_user=current_user,
    )


# =========================================================
# WORKFLOW: SUBMIT (draft → submitted)
# =========================================================

@router.patch(
    "/{category_need_id}/submit",
    response_model=CategoryNeedDetailResponse,
)
def submit_need(
    category_need_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    """Gửi phiếu nhu cầu để duyệt (draft → submitted)."""

    need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    submit_category_need(
        db=db,
        category_need=need,
        current_user=current_user,
    )

    refreshed = get_category_need_or_404(
        db=db,
        category_need_id=need.id,
    )

    current_qty = 0
    if refreshed.category:
        from app.services.category_needs_service import _get_current_quantity
        current_qty = _get_current_quantity(
            db,
            refreshed.category_id,
            refreshed.category.category_type,
            refreshed.department_id,
        )

    return _map_to_response(refreshed, current_qty)


# =========================================================
# WORKFLOW: APPROVE (submitted → approved)
# =========================================================

@router.patch(
    "/{category_need_id}/approve",
    response_model=CategoryNeedDetailResponse,
)
def approve_need(
    category_need_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Phê duyệt phiếu nhu cầu (submitted → approved). Chỉ Admin."""

    need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    approve_category_need(
        db=db,
        category_need=need,
        current_user=current_user,
    )

    refreshed = get_category_need_or_404(
        db=db,
        category_need_id=need.id,
    )

    current_qty = 0
    if refreshed.category:
        from app.services.category_needs_service import _get_current_quantity
        current_qty = _get_current_quantity(
            db,
            refreshed.category_id,
            refreshed.category.category_type,
            refreshed.department_id,
        )

    return _map_to_response(refreshed, current_qty)


# =========================================================
# WORKFLOW: REJECT (submitted → rejected)
# =========================================================

@router.patch(
    "/{category_need_id}/reject",
    response_model=CategoryNeedDetailResponse,
)
def reject_need(
    category_need_id: int,
    payload: CategoryNeedRejectPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Từ chối phiếu nhu cầu (submitted → rejected). Chỉ Admin."""

    need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    reject_category_need(
        db=db,
        category_need=need,
        current_user=current_user,
        rejected_reason=payload.rejected_reason,
    )

    refreshed = get_category_need_or_404(
        db=db,
        category_need_id=need.id,
    )

    current_qty = 0
    if refreshed.category:
        from app.services.category_needs_service import _get_current_quantity
        current_qty = _get_current_quantity(
            db,
            refreshed.category_id,
            refreshed.category.category_type,
            refreshed.department_id,
        )

    return _map_to_response(refreshed, current_qty)


# =========================================================
# WORKFLOW: CANCEL (draft/submitted → cancelled)
# =========================================================

@router.patch(
    "/{category_need_id}/cancel",
    response_model=CategoryNeedDetailResponse,
)
def cancel_need(
    category_need_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    """Hủy phiếu nhu cầu (draft/submitted → cancelled)."""

    need = get_category_need_or_404(
        db=db,
        category_need_id=category_need_id,
    )

    cancel_category_need(
        db=db,
        category_need=need,
        current_user=current_user,
    )

    refreshed = get_category_need_or_404(
        db=db,
        category_need_id=need.id,
    )

    current_qty = 0
    if refreshed.category:
        from app.services.category_needs_service import _get_current_quantity
        current_qty = _get_current_quantity(
            db,
            refreshed.category_id,
            refreshed.category.category_type,
            refreshed.department_id,
        )

    return _map_to_response(refreshed, current_qty)