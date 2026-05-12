from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.asset import AssetCondition, AssetStatus
from app.models.asset_quantity import QuantityAssetApprovalStatus
from app.schemas.category import CategorySimple
from app.schemas.department import DepartmentSimple
from app.schemas.location_quantity_asset import (
    LocationQuantityAssetResponse,
)
from app.schemas.user import UserSimple


# =========================================================
# BASE SCHEMA
# =========================================================

class AssetQuantityBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(
        min_length=2,
        max_length=100,
    )
    name: str = Field(
        min_length=2,
        max_length=255,
    )

    quantity: int = Field(
        default=0,
        ge=0,
    )

    available_quantity: int | None = Field(
        default=None,
        ge=0,
    )

    serial_number: str | None = Field(
        default=None,
        max_length=100,
    )

    specification: str | None = Field(
        default=None,
        max_length=2000,
    )

    purchase_date: date | None = None

    useful_life: int | None = Field(
        default=None,
        ge=0,
    )

    purchase_cost: Decimal | None = Field(
        default=None,
        ge=0,
    )

    status: AssetStatus = AssetStatus.AVAILABLE

    condition: AssetCondition = AssetCondition.GOOD

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    note: str | None = Field(
        default=None,
        max_length=2000,
    )

    # Quan hệ danh mục
    category_id: int | None = Field(
        default=None,
        ge=1,
    )

    assigned_department_id: int | None = Field(
        default=None,
        ge=1,
    )

    assigned_user_id: int | None = Field(
        default=None,
        ge=1,
    )

    is_active: bool = True

    required_quantity_category: int = Field(
        default=200,
        ge=0,
    )


# =========================================================
# CREATE
# =========================================================

class AssetQuantityCreate(AssetQuantityBase):
    pass


# =========================================================
# UPDATE
# =========================================================

class AssetQuantityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )

    quantity: int | None = Field(
        default=None,
        ge=0,
    )

    available_quantity: int | None = Field(
        default=None,
        ge=0,
    )

    serial_number: str | None = Field(
        default=None,
        max_length=100,
    )

    specification: str | None = Field(
        default=None,
        max_length=2000,
    )

    purchase_date: date | None = None

    useful_life: int | None = Field(
        default=None,
        ge=0,
    )

    purchase_cost: Decimal | None = Field(
        default=None,
        ge=0,
    )

    status: AssetStatus | None = None

    condition: AssetCondition | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    note: str | None = Field(
        default=None,
        max_length=2000,
    )

    category_id: int | None = Field(
        default=None,
        ge=1,
    )

    assigned_department_id: int | None = Field(
        default=None,
        ge=1,
    )

    assigned_user_id: int | None = Field(
        default=None,
        ge=1,
    )

    is_active: bool | None = None

    required_quantity_category: int | None = Field(
        default=None,
        ge=0,
    )


# =========================================================
# SIMPLE RESPONSE
# =========================================================

class AssetQuantitySimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str

    quantity: int
    available_quantity: int

    category_id: int | None = None

    is_active: bool


# =========================================================
# FULL RESPONSE
# =========================================================

class AssetQuantityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    code: str
    name: str

    quantity: int

    available_quantity: int

    serial_number: str | None = None

    specification: str | None = None

    purchase_date: date | None = None

    useful_life: int | None = None

    purchase_cost: Decimal | None = None

    status: AssetStatus

    condition: AssetCondition

    location: str | None = None

    note: str | None = None

    # =========================
    # Category
    # =========================

    category_id: int | None = None

    category: CategorySimple | None = None

    # Dùng cho frontend dropdown/filter
    category_name: str | None = None

    category_code: str | None = None

    # =========================
    # Assignment
    # =========================

    assigned_department_id: int | None = None

    assigned_user_id: int | None = None

    assigned_department: DepartmentSimple | None = None

    assigned_user: UserSimple | None = None

    # =========================
    # Status
    # =========================

    is_active: bool

    approval_status: QuantityAssetApprovalStatus

    required_quantity_category: int

    # =========================
    # Locations
    # =========================

    locations: list[LocationQuantityAssetResponse] = []

    # =========================
    # Timestamps
    # =========================

    created_at: datetime

    updated_at: datetime


# =========================================================
# STATUS UPDATE
# =========================================================

class AssetQuantityStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AssetStatus

    condition: AssetCondition | None = None

    note: str | None = Field(
        default=None,
        max_length=2000,
    )