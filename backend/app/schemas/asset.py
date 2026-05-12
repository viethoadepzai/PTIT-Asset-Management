from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.asset import AssetCondition, AssetStatus
from app.schemas.category import CategorySimple
from app.schemas.department import DepartmentSimple
from app.schemas.user import UserSimple


class AssetBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=255)
    qr_code: str | None = Field(default=None, max_length=255)
    serial_number: str | None = Field(default=None, max_length=100)
    specification: str | None = Field(default=None, max_length=2000)
    purchase_date: date | None = None
    useful_life: int | None = Field(default=None, ge=0)
    purchase_cost: Decimal | None = Field(default=None, ge=0)
    status: AssetStatus = AssetStatus.AVAILABLE
    condition: AssetCondition = AssetCondition.GOOD
    location: str | None = Field(default=None, max_length=255)
    note: str | None = Field(default=None, max_length=2000)
    vendor_name: str | None = Field(default=None, max_length=255)
    category_id: int | None = Field(default=None, ge=1)
    assigned_department_id: int | None = Field(default=None, ge=1)
    assigned_user_id: int | None = Field(default=None, ge=1)
    is_active: bool = True


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_code: str | None = Field(default=None, min_length=2, max_length=50)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    qr_code: str | None = Field(default=None, max_length=255)
    serial_number: str | None = Field(default=None, max_length=100)
    specification: str | None = Field(default=None, max_length=2000)
    purchase_date: date | None = None
    useful_life: int | None = Field(default=None, ge=0)
    purchase_cost: Decimal | None = Field(default=None, ge=0)
    status: AssetStatus | None = None
    condition: AssetCondition | None = None
    location: str | None = Field(default=None, max_length=255)
    note: str | None = Field(default=None, max_length=2000)
    vendor_name: str | None = Field(default=None, max_length=255)
    category_id: int | None = Field(default=None, ge=1)
    assigned_department_id: int | None = Field(default=None, ge=1)
    assigned_user_id: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_code: str
    name: str
    qr_code: str | None = None
    serial_number: str | None = None
    specification: str | None = None
    purchase_date: date | None = None
    useful_life: int | None = None
    purchase_cost: Decimal | None = None
    status: AssetStatus
    condition: AssetCondition
    location: str | None = None
    note: str | None = None
    vendor_name: str | None = None
    category_id: int | None = None
    assigned_department_id: int | None = None
    assigned_user_id: int | None = None
    assigned_department: DepartmentSimple | None = None
    assigned_user: UserSimple | None = None
    category: CategorySimple | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssetStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AssetStatus
    condition: AssetCondition | None = None
    note: str | None = Field(default=None, max_length=2000)
