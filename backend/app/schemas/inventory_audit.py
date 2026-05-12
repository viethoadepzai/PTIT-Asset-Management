from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# AUDIT ITEM
# =========================================================

class InventoryAuditItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int = Field(ge=1)
    actual_quantity: int = Field(ge=0)
    damaged_quantity: int = Field(ge=0)
    notes: str | None = None


class InventoryAuditItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    audit_id: int
    quantity_asset_id: int
    expected_quantity: int
    actual_quantity: int
    damaged_quantity: int
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    quantity_asset_name: str | None = None
    quantity_asset_code: str | None = None

    @property
    def difference(self) -> int:
        return self.actual_quantity - self.expected_quantity

    @property
    def missing_quantity(self) -> int:
        return max(self.expected_quantity - self.actual_quantity - self.damaged_quantity, 0)


# =========================================================
# AUDIT
# =========================================================

class InventoryAuditCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=2, max_length=50)
    department_id: int = Field(ge=1)
    scheduled_date: date
    assigned_to_user_id: int | None = None


class InventoryAuditUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_date: date | None = None
    assigned_to_user_id: int | None = None


class InventoryAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    department_id: int
    scheduled_date: date
    status: str
    assigned_to_user_id: int | None = None
    created_by_user_id: int | None = None
    approved_by_user_id: int | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    department_name: str | None = None
    department_code: str | None = None
    assigned_to_user_name: str | None = None
    created_by_user_name: str | None = None
    approved_by_user_name: str | None = None


class InventoryAuditDetailResponse(InventoryAuditResponse):
    items: list[InventoryAuditItemResponse] = []
