from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategorySimple
from app.schemas.department import DepartmentSimple


class SupplyBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supply_code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=255)
    unit: str = Field(default="item", min_length=1, max_length=50)
    quantity_in_stock: Decimal = Field(default=0, ge=0)
    minimum_stock_level: Decimal = Field(default=0, ge=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    category_id: int | None = Field(default=None, ge=1)
    managed_department_id: int | None = Field(default=None, ge=1)
    is_active: bool = True


class SupplyCreate(SupplyBase):
    pass


class SupplyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supply_code: str | None = Field(default=None, min_length=2, max_length=50)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    quantity_in_stock: Decimal | None = Field(default=None, ge=0)
    minimum_stock_level: Decimal | None = Field(default=None, ge=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    category_id: int | None = Field(default=None, ge=1)
    managed_department_id: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class SupplyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supply_code: str
    name: str
    unit: str
    quantity_in_stock: Decimal
    minimum_stock_level: Decimal
    unit_price: Decimal | None = None
    location: str | None = None
    description: str | None = None
    note: str | None = None
    category_id: int | None = None
    managed_department_id: int | None = None
    managed_department: DepartmentSimple | None = None
    category: CategorySimple | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SupplyStockUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quantity_change: Decimal = Field(..., description="Positive for stock-in, negative for stock-out")
    note: str | None = Field(default=None, max_length=2000)
