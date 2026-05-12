from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User
    from app.models.asset_quantity import AssetQuantity


class InventoryAuditStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InventoryAudit(Base):
    """Đợt kiểm kê tài sản số lượng lớn cho phòng ban."""

    __tablename__ = "inventory_audits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    scheduled_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[InventoryAuditStatus] = mapped_column(
        SqlEnum(
            InventoryAuditStatus,
            name="inventory_audit_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=InventoryAuditStatus.SCHEDULED,
        nullable=False,
    )

    assigned_to_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

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

    assigned_to_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to_user_id],
    )

    created_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
    )

    approved_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[approved_by_user_id],
    )

    items: Mapped[list["InventoryAuditItem"]] = relationship(
        "InventoryAuditItem",
        back_populates="audit",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"InventoryAudit(id={self.id!r}, code={self.code!r}, status={self.status!r})"


class InventoryAuditItem(Base):
    """Chi tiết từng loại tài sản trong đợt kiểm kê."""

    __tablename__ = "inventory_audit_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    audit_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_audits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity_asset_id: Mapped[int] = mapped_column(
        ForeignKey("quantity_assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    expected_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    actual_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    damaged_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

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

    audit: Mapped["InventoryAudit"] = relationship(
        "InventoryAudit",
        back_populates="items",
    )

    quantity_asset: Mapped["AssetQuantity"] = relationship("AssetQuantity")

    __table_args__ = (
        CheckConstraint("expected_quantity >= 0", name="expected_qty_non_negative"),
        CheckConstraint("actual_quantity >= 0", name="actual_qty_non_negative"),
        CheckConstraint("damaged_quantity >= 0", name="damaged_qty_non_negative"),
    )

    def __repr__(self) -> str:
        return (
            f"InventoryAuditItem(id={self.id!r}, "
            f"expected={self.expected_quantity!r}, "
            f"actual={self.actual_quantity!r}, "
            f"damaged={self.damaged_quantity!r})"
        )
