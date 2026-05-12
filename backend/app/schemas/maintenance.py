from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.asset import AssetStatus
from app.models.maintenance import MaintenancePriority, MaintenanceStatus, MaintenanceType
from app.schemas.user import UserSimple


class MaintenanceAssetReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_code: str
    name: str
    category_id: int | None = None
    status: AssetStatus


class MaintenanceBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    maintenance_code: str = Field(min_length=2, max_length=50)
    asset_id: int = Field(ge=1)
    maintenance_type: MaintenanceType = MaintenanceType.CORRECTIVE
    status: MaintenanceStatus = MaintenanceStatus.SCHEDULED
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=3000)
    scheduled_date: date | None = None
    next_maintenance_date: date | None = None
    cost: Decimal | None = Field(default=None, ge=0)
    vendor_name: str | None = Field(default=None, max_length=255)
    resolution_note: str | None = Field(default=None, max_length=3000)
    assigned_to_user_id: int | None = Field(default=None, ge=1)
    is_active: bool = True


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    maintenance_code: str | None = Field(default=None, min_length=2, max_length=50)
    maintenance_type: MaintenanceType | None = None
    priority: MaintenancePriority | None = None
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=3000)
    scheduled_date: date | None = None
    next_maintenance_date: date | None = None
    cost: Decimal | None = Field(default=None, ge=0)
    vendor_name: str | None = Field(default=None, max_length=255)
    resolution_note: str | None = Field(default=None, max_length=3000)
    assigned_to_user_id: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class MaintenanceStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: MaintenanceStatus
    resolution_note: str | None = Field(default=None, max_length=3000)
    cost: Decimal | None = Field(default=None, ge=0)
    next_maintenance_date: date | None = None


class MaintenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    maintenance_code: str
    asset_id: int
    maintenance_type: MaintenanceType
    status: MaintenanceStatus
    priority: MaintenancePriority
    title: str
    description: str | None = None
    scheduled_date: date | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    next_maintenance_date: date | None = None
    cost: Decimal | None = None
    vendor_name: str | None = None
    resolution_note: str | None = None
    reported_by_user_id: int | None = None
    assigned_to_user_id: int | None = None
    asset: MaintenanceAssetReference
    reported_by_user: UserSimple | None = None
    assigned_to_user: UserSimple | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
