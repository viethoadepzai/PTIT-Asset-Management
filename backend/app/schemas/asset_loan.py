from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.asset_loan_voucher import AssetLoanStatus


class AssetLoanItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_id: int
    note: str | None = Field(default=None, max_length=2000)


class AssetLoanCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    borrower_department_id: int | None = None
    borrower_user_id: int | None = None
    loan_date: date
    expected_return_date: date | None = None
    purpose: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    items: list[AssetLoanItemCreate]

    @field_validator("items")
    @classmethod
    def validate_items_not_empty(cls, value: list[AssetLoanItemCreate]) -> list[AssetLoanItemCreate]:
        if not value:
            raise ValueError("items must not be empty")
        return value

    @field_validator("expected_return_date")
    @classmethod
    def validate_return_date(cls, value: date | None) -> date | None:
        return value


class AssetLoanReceiveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str | None = Field(default=None, max_length=2000)


class AssetLoanReturnItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int
    condition_after_return: str
    note: str | None = Field(default=None, max_length=2000)


class AssetLoanReturnRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actual_return_date: date
    note: str | None = Field(default=None, max_length=2000)
    items: list[AssetLoanReturnItemUpdate] = Field(default_factory=list)


class AssetLoanCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str | None = Field(default=None, max_length=2000)


class AssetLoanItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    voucher_id: int
    asset_id: int | None
    asset_code_snapshot: str
    asset_name_snapshot: str
    condition_before_snapshot: str
    condition_after_return: str | None
    note: str | None


class AssetLoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    voucher_code: str
    borrower_department_id: int | None
    borrower_user_id: int | None
    approved_by_user_id: int | None
    loan_date: date
    expected_return_date: date | None
    actual_return_date: date | None
    status: AssetLoanStatus
    purpose: str | None
    note: str | None
    created_at: datetime
    updated_at: datetime
    items: list[AssetLoanItemResponse]