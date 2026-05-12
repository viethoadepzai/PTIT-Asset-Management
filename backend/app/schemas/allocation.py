from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.allocation import AllocationStatus, AllocationType
from app.models.asset import AssetStatus
from app.schemas.department import DepartmentSimple
from app.schemas.user import UserSimple


class AssetAllocationReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_code: str
    name: str
    status: AssetStatus


class SupplyAllocationReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supply_code: str
    name: str
    unit: str
    quantity_in_stock: Decimal


class AllocationBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    allocation_code: str = Field(min_length=2, max_length=50)
    allocation_type: AllocationType
    asset_id: int | None = Field(default=None, ge=1)
    supply_id: int | None = Field(default=None, ge=1)
    quantity: Decimal = Field(default=1, gt=0)
    allocated_department_id: int | None = Field(default=None, ge=1)
    allocated_user_id: int | None = Field(default=None, ge=1)
    expected_return_date: date | None = None
    purpose: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    is_active: bool = True

    @model_validator(mode="after")
    def validate_resource_selection(self) -> "AllocationBase":
        has_asset = self.asset_id is not None
        has_supply = self.supply_id is not None

        if has_asset == has_supply:
            raise ValueError("Provide exactly one of asset_id or supply_id")

        if self.allocation_type == AllocationType.ASSET:
            if not has_asset:
                raise ValueError("asset_id is required when allocation_type is 'asset'")
            if self.quantity != 1:
                raise ValueError("Quantity must be 1 for asset allocation")

        if self.allocation_type == AllocationType.SUPPLY and not has_supply:
            raise ValueError("supply_id is required when allocation_type is 'supply'")

        return self


class AllocationCreate(AllocationBase):
    pass


class AllocationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    allocated_department_id: int | None = Field(default=None, ge=1)
    allocated_user_id: int | None = Field(default=None, ge=1)
    expected_return_date: date | None = None
    purpose: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class AllocationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AllocationStatus
    note: str | None = Field(default=None, max_length=2000)


class AllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    allocation_code: str
    allocation_type: AllocationType
    status: AllocationStatus
    asset_id: int | None = None
    supply_id: int | None = None
    quantity: Decimal
    allocated_department_id: int | None = None
    allocated_user_id: int | None = None
    allocated_by_user_id: int | None = None
    allocated_at: datetime
    expected_return_date: date | None = None
    returned_at: datetime | None = None
    purpose: str | None = None
    note: str | None = None
    asset: AssetAllocationReference | None = None
    supply: SupplyAllocationReference | None = None
    allocated_department: DepartmentSimple | None = None
    allocated_user: UserSimple | None = None
    allocated_by_user: UserSimple | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime