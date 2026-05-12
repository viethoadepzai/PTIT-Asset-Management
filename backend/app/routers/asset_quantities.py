from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.asset import (
    AssetCondition,
    AssetStatus,
)
from app.models.user import (
    User,
    UserRole,
)

from app.schemas.asset_quantity import (
    AssetQuantityCreate,
    AssetQuantityResponse,
    AssetQuantityStatusUpdate,
    AssetQuantityUpdate,
)

from app.schemas.location_quantity_asset import (
    ApproveLostLocationRequest,
    LocationQuantityAssetCreate,
    LocationQuantityAssetResponse,
    LocationQuantityAssetUpdate,
)

from app.services.asset_quantity_service import (
    activate_asset_quantity,
    approve_asset_quantity,
    create_asset_quantity,
    deactivate_asset_quantity,
    get_asset_quantity_or_404,
    list_asset_quantities,
    reject_asset_quantity,
    update_asset_quantity,
    update_asset_quantity_status,
)

from app.services.location_quantity_asset_service import (
    approve_location_service,
    approve_lost_location_service,
    create_location,
    create_lost_location,
    delete_location,
    list_locations,
    update_location,
)

router = APIRouter(
    prefix="/asset-quantities",
    tags=["Asset Quantities"],
)


# =========================================================
# GET ALL ASSET QUANTITIES
# =========================================================

@router.get(
    "",
    response_model=list[AssetQuantityResponse],
)
def read_asset_quantities(
    skip: int = Query(default=0, ge=0),

    limit: int = Query(
        default=100,
        ge=1,
        le=200,
    ),

    keyword: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),

    # Quan trọng:
    # filter theo category
    category_id: int | None = Query(
        default=None,
        ge=1,
    ),

    status_filter: AssetStatus | None = Query(
        default=None,
        alias="status",
    ),

    condition_filter: AssetCondition | None = Query(
        default=None,
        alias="condition",
    ),

    assigned_department_id: int | None = Query(
        default=None,
        ge=1,
    ),

    assigned_user_id: int | None = Query(
        default=None,
        ge=1,
    ),

    is_active: bool | None = Query(
        default=None,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.STAFF,
        )
    ),
):
    """
    Lấy danh sách tài sản số lượng lớn.

    Hỗ trợ:
    - search keyword
    - filter category
    - filter trạng thái
    - filter department
    """

    return list_asset_quantities(
        db=db,
        skip=skip,
        limit=limit,

        keyword=keyword,

        category_id=category_id,

        status_filter=(
            status_filter.value
            if status_filter is not None
            else None
        ),

        condition_filter=(
            condition_filter.value
            if condition_filter is not None
            else None
        ),

        assigned_department_id=assigned_department_id,

        assigned_user_id=assigned_user_id,

        is_active=is_active,

        current_user=current_user,
    )


# =========================================================
# GET ONE ASSET QUANTITY
# =========================================================

@router.get(
    "/{asset_quantity_id}",
    response_model=AssetQuantityResponse,
)
def read_asset_quantity(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.STAFF,
        )
    ),
):
    return get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
        current_user=current_user,
    )


# =========================================================
# GET ASSET QUANTITIES BY CATEGORY
# =========================================================

@router.get(
    "/category/{category_id}",
    response_model=list[AssetQuantityResponse],
)
def read_asset_quantities_by_category(
    category_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.STAFF,
        )
    ),
):
    """
    API phục vụ frontend dropdown.

    Ví dụ:
    Category = Bàn

    Trả:
    - Bàn 4 chân
    - Bàn 6 chỗ
    """

    return list_asset_quantities(
        db=db,
        skip=0,
        limit=1000,

        keyword=None,

        category_id=category_id,

        status_filter=None,
        condition_filter=None,

        assigned_department_id=None,
        assigned_user_id=None,

        is_active=True,

        current_user=current_user,
    )


# =========================================================
# CREATE
# =========================================================

@router.post(
    "",
    response_model=AssetQuantityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_asset_quantity(
    payload: AssetQuantityCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    return create_asset_quantity(
        db=db,
        payload=payload,
        current_user=current_user,
    )


# =========================================================
# UPDATE
# =========================================================

@router.put(
    "/{asset_quantity_id}",
    response_model=AssetQuantityResponse,
)
def update_existing_asset_quantity(
    asset_quantity_id: int,

    payload: AssetQuantityUpdate,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return update_asset_quantity(
        db=db,
        asset_quantity=asset_quantity,
        payload=payload,
    )


# =========================================================
# UPDATE STATUS
# =========================================================

@router.patch(
    "/{asset_quantity_id}/status",
    response_model=AssetQuantityResponse,
)
def update_existing_asset_quantity_status(
    asset_quantity_id: int,

    payload: AssetQuantityStatusUpdate,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return update_asset_quantity_status(
        db=db,
        asset_quantity=asset_quantity,
        payload=payload,
    )


# =========================================================
# APPROVE
# =========================================================

@router.patch(
    "/{asset_quantity_id}/approve",
    response_model=AssetQuantityResponse,
)
def approve_existing_asset_quantity(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return approve_asset_quantity(
        db=db,
        asset_quantity=asset_quantity,
    )


# =========================================================
# REJECT
# =========================================================

@router.patch(
    "/{asset_quantity_id}/reject",
    response_model=AssetQuantityResponse,
)
def reject_existing_asset_quantity(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return reject_asset_quantity(
        db=db,
        asset_quantity=asset_quantity,
    )


# =========================================================
# DEACTIVATE
# =========================================================

@router.patch(
    "/{asset_quantity_id}/deactivate",
    response_model=AssetQuantityResponse,
)
def deactivate_existing_asset_quantity(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return deactivate_asset_quantity(
        db=db,
        asset_quantity=asset_quantity,
    )


# =========================================================
# ACTIVATE
# =========================================================

@router.patch(
    "/{asset_quantity_id}/activate",
    response_model=AssetQuantityResponse,
)
def activate_existing_asset_quantity(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    asset_quantity = get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return activate_asset_quantity(
        db=db,
        asset_quantity=asset_quantity,
    )


# =========================================================
# LOCATION APIs
# =========================================================

@router.get(
    "/{asset_quantity_id}/locations",
    response_model=list[LocationQuantityAssetResponse],
)
def read_locations(
    asset_quantity_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.STAFF,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return list_locations(
        db=db,
        quantity_assets_id=asset_quantity_id,
    )


@router.post(
    "/{asset_quantity_id}/locations",
    response_model=LocationQuantityAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_location(
    asset_quantity_id: int,

    payload: LocationQuantityAssetCreate,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return create_location(
        db=db,
        quantity_assets_id=asset_quantity_id,
        payload=payload,
    )


@router.post(
    "/{asset_quantity_id}/lost-locations",
    response_model=LocationQuantityAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_lost_location(
    asset_quantity_id: int,

    payload: LocationQuantityAssetCreate,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return create_lost_location(
        db=db,
        quantity_assets_id=asset_quantity_id,
        payload=payload,
    )


@router.put(
    "/{asset_quantity_id}/locations/{location_id}",
    response_model=LocationQuantityAssetResponse,
)
def edit_location(
    asset_quantity_id: int,

    location_id: int,

    payload: LocationQuantityAssetUpdate,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return update_location(
        db=db,
        quantity_assets_id=asset_quantity_id,
        location_id=location_id,
        payload=payload,
    )


# =========================================================
# APPROVE LOCATION
# =========================================================

@router.patch(
    "/{asset_quantity_id}/locations/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def approve_location(
    asset_quantity_id: int,

    location_id: int,

    payload: ApproveLostLocationRequest,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return approve_location_service(
        db=db,
        quantity_assets_id=asset_quantity_id,
        location_id=location_id,
        room_code=payload.room_code.strip(),
    )


# =========================================================
# APPROVE LOST LOCATION
# =========================================================

@router.patch(
    "/{asset_quantity_id}/lost-locations/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def approve_lost_location(
    asset_quantity_id: int,

    location_id: int,

    payload: ApproveLostLocationRequest,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    return approve_lost_location_service(
        db=db,
        quantity_assets_id=asset_quantity_id,
        location_id=location_id,
        room_code=payload.room_code.strip(),
    )


# =========================================================
# DELETE LOCATION
# =========================================================

@router.delete(
    "/{asset_quantity_id}/locations/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_location(
    asset_quantity_id: int,

    location_id: int,

    db: Session = Depends(get_db),

    _: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):

    get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
    )

    delete_location(
        db=db,
        quantity_assets_id=asset_quantity_id,
        location_id=location_id,
    )