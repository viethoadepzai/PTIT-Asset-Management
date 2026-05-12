from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset_quantity import AssetQuantity
    from app.models.department import Department


class DepartmentQuantityAssetAllocation(Base):
    """Phân bổ tài sản số lượng lớn cho phòng ban.

    Mỗi phòng ban chỉ có MỘT bản ghi cho mỗi loại tài sản.
    Khi duyệt nhu cầu nhiều lần, ``allocated_quantity`` được cộng dồn.

    Ví dụ:
        Lần 1 – duyệt 500 bàn 6 chỗ cho Phòng CNTT → allocated_quantity = 500
        Lần 2 – duyệt 300 bàn 6 chỗ cho Phòng CNTT → allocated_quantity = 800
    """

    __tablename__ = "department_quantity_asset_allocations"

    # =========================
    # Primary Key
    # =========================

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # =========================
    # Foreign Keys
    # =========================

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity_asset_id: Mapped[int] = mapped_column(
        ForeignKey("quantity_assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # =========================
    # Allocation Data
    # =========================

    allocated_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # =========================
    # Timestamps
    # =========================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # =========================
    # Relationships
    # =========================

    department: Mapped["Department"] = relationship("Department")
    quantity_asset: Mapped["AssetQuantity"] = relationship("AssetQuantity")

    # =========================
    # Constraints
    # =========================

    __table_args__ = (
        UniqueConstraint(
            "department_id",
            "quantity_asset_id",
            name="uq_dept_qty_asset",
        ),
        CheckConstraint(
            "allocated_quantity >= 0",
            name="allocated_quantity_non_negative",
        ),
    )

    # =========================
    # Representation
    # =========================

    def __repr__(self) -> str:
        return (
            f"DepartmentQuantityAssetAllocation("
            f"id={self.id!r}, "
            f"department_id={self.department_id!r}, "
            f"quantity_asset_id={self.quantity_asset_id!r}, "
            f"allocated_quantity={self.allocated_quantity!r})"
        )
