from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.models.location_quantity_asset import LocationApprovalStatus


class ApproveLostLocationRequest(BaseModel):
    room_code: str

class LocationQuantityAssetBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    room_code: str = Field(min_length=1, max_length=50, default="KHO")
    quantity: int = Field(default=0)
    reason: str | None = None
    status_approval: LocationApprovalStatus = LocationApprovalStatus.PENDING


class LocationQuantityAssetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    room_code: str = Field(min_length=1, max_length=50)
    quantity: int = Field(default=0)
    reason: str | None = None


class LocationQuantityAssetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quantity: int = Field(default=0)
    reason: str | None = None
    status_approval: LocationApprovalStatus | None = None


class LocationQuantityAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_code: str
    quantity: int 
    reason: str | None = None
    status_approval: LocationApprovalStatus
    quantity_assets_id: int | None = None
