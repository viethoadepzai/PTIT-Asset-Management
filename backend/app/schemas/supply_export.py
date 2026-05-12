from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.supply_export_voucher import SupplyExportStatus


class SupplyExportItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supply_id: int
    quantity: Decimal = Field(gt=0)
    note: str | None = Field(default=None, max_length=2000)


class SupplyExportCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recipient_department_id: int | None = None
    reason: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    items: list[SupplyExportItemCreate]

    @field_validator("items")
    @classmethod
    def validate_items_not_empty(cls, value: list[SupplyExportItemCreate]) -> list[SupplyExportItemCreate]:
        if not value:
            raise ValueError("items must not be empty")
        return value


class SupplyExportCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str | None = Field(default=None, max_length=2000)


class SupplyExportItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    voucher_id: int
    supply_id: int | None
    supply_code_snapshot: str
    supply_name_snapshot: str
    unit_snapshot: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal
    note: str | None


class SupplyExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    voucher_code: str
    export_date: datetime
    recipient_department_id: int | None
    created_by_user_id: int | None
    approved_by_user_id: int | None
    status: SupplyExportStatus
    reason: str | None
    note: str | None
    total_quantity: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[SupplyExportItemResponse]