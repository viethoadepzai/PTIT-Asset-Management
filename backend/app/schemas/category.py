from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# CATEGORY BASE
# =========================================================

class CategoryBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_code: str = Field(
        min_length=2,
        max_length=50,
    )

    category_name: str = Field(
        min_length=1,
        max_length=100,
    )

    category_type: str = Field(
        pattern="^(supply|asset)$",
        description="Loại danh mục: supply hoặc asset",
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    note: str | None = Field(
        default=None,
        max_length=2000,
    )


# =========================================================
# CATEGORY CREATE
# =========================================================

class CategoryCreate(CategoryBase):
    pass


# =========================================================
# CATEGORY UPDATE
# =========================================================

class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    category_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    category_type: str | None = Field(
        default=None,
        pattern="^(supply|asset)$",
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    note: str | None = Field(
        default=None,
        max_length=2000,
    )

    is_active: bool | None = None


# =========================================================
# CATEGORY NEED BASE
# =========================================================

class CategoryNeedBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: int = Field(
        ge=1,
        description="ID danh mục",
    )

    department_id: int | None = Field(
        default=None,
        ge=1,
        description="ID phòng ban",
    )

    asset_quantity_id: int | None = Field(
        default=None,
        ge=1,
        description="ID tài sản số lượng",
    )

    require_quantity: int = Field(
        ge=0,
        description="Số lượng yêu cầu",
    )

    detail: str | None = Field(
        default=None,
        max_length=2000,
    )


# =========================================================
# CATEGORY NEED CREATE
# =========================================================

class CategoryNeedCreate(CategoryNeedBase):
    pass


# =========================================================
# CATEGORY NEED UPDATE
# =========================================================

class CategoryNeedUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    department_id: int | None = Field(
        default=None,
        ge=1,
    )

    asset_quantity_id: int | None = Field(
        default=None,
        ge=1,
    )

    require_quantity: int | None = Field(
        default=None,
        ge=0,
    )

    detail: str | None = Field(
        default=None,
        max_length=2000,
    )

    is_active: bool | None = None


# =========================================================
# CATEGORY NEED REJECT (body for reject action)
# =========================================================

class CategoryNeedRejectPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rejected_reason: str = Field(
        min_length=1,
        max_length=2000,
        description="Lý do từ chối",
    )


# =========================================================
# CATEGORY NEED RESPONSE
# =========================================================

class CategoryNeedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    category_id: int

    department_id: int | None = None

    asset_quantity_id: int | None = None

    asset_quantity_name: str | None = None

    require_quantity: int

    detail: str | None = None

    is_active: bool

    # Workflow fields
    status: str = "draft"

    created_by_user_id: int | None = None
    created_by_user_name: str | None = None

    submitted_at: datetime | None = None

    approved_at: datetime | None = None
    approved_by_user_id: int | None = None
    approved_by_user_name: str | None = None

    rejected_reason: str | None = None

    created_at: datetime

    updated_at: datetime


# =========================================================
# CATEGORY SIMPLE
# =========================================================

class CategorySimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_code: str

    category_name: str


# =========================================================
# CATEGORY RESPONSE
# =========================================================

class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    category_code: str

    category_name: str

    category_type: str

    description: str | None = None

    note: str | None = None

    is_active: bool

    created_at: datetime

    updated_at: datetime


# =========================================================
# CATEGORY DETAIL RESPONSE
# =========================================================

class CategoryDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    category_code: str

    category_name: str

    category_type: str

    description: str | None = None

    note: str | None = None

    is_active: bool

    created_at: datetime

    updated_at: datetime

    needs: list[CategoryNeedResponse] = []
