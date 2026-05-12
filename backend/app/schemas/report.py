from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.allocation import AllocationStatus
from app.models.asset import AssetStatus
from app.models.maintenance import MaintenanceStatus


class DashboardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated_at: datetime
    total_departments: int
    total_users: int
    total_assets: int
    total_supplies: int
    active_allocations: int
    active_maintenances: int
    low_stock_supplies: int
    pending_quantity_assets: int = 0


class AssetStatusSummaryItem(BaseModel):
    status: AssetStatus
    count: int


class LowStockSupplyItem(BaseModel):
    id: int
    supply_code: str
    name: str
    category_id: int | None = None
    unit: str
    quantity_in_stock: Decimal
    minimum_stock_level: Decimal
    managed_department_id: int | None = None
    managed_department_name: str | None = None


class AllocationStatusSummaryItem(BaseModel):
    status: AllocationStatus
    count: int


class MaintenanceStatusSummaryItem(BaseModel):
    status: MaintenanceStatus
    count: int


class RecentActivityItem(BaseModel):
    source: str
    code: str
    title: str
    status: str
    activity_date: datetime | date | None = None


class QuantityAssetStatusSummaryItem(BaseModel):
    status: str
    count: int


class AssetsByDepartmentItem(BaseModel):
    department_name: str
    asset_count: int
    quantity_asset_count: int


class PendingApprovalItem(BaseModel):
    id: int
    code: str
    name: str
    category_id: int | None = None
    quantity: int
    created_at: datetime
