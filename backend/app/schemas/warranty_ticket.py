from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.warranty_ticket import WarrantyStatus


class WarrantyTicketCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_id: int
    vendor_name: str | None = Field(default=None, max_length=255)
    provider_contact: str | None = Field(default=None, max_length=255)
    warranty_start_date: date | None = None
    warranty_end_date: date | None = None
    sent_date: date | None = None
    expected_return_date: date | None = None
    issue_description: str = Field(..., max_length=5000)
    note: str | None = Field(default=None, max_length=2000)


class WarrantySendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sent_date: date | None = None
    expected_return_date: date | None = None
    note: str | None = Field(default=None, max_length=2000)


class WarrantyCompleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    received_back_date: date
    resolution_note: str | None = Field(default=None, max_length=5000)
    maintenance_cost: Decimal | None = None
    note: str | None = Field(default=None, max_length=2000)


class WarrantyCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str | None = Field(default=None, max_length=2000)


class WarrantyTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    warranty_code: str
    asset_id: int
    maintenance_id: int | None
    created_by_user_id: int | None
    handled_by_user_id: int | None
    vendor_name: str | None
    provider_contact: str | None
    warranty_start_date: date | None
    warranty_end_date: date | None
    sent_date: date | None
    expected_return_date: date | None
    received_back_date: date | None
    issue_description: str
    resolution_note: str | None
    note: str | None
    status: WarrantyStatus
    created_at: datetime
    updated_at: datetime