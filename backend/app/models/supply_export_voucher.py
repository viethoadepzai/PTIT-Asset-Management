from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.supply_export_item import SupplyExportItem
    from app.models.user import User


class SupplyExportStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    CANCELLED = "cancelled"


class SupplyExportVoucher(Base):
    __tablename__ = "supply_export_vouchers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    voucher_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    export_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    recipient_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
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

    status: Mapped[SupplyExportStatus] = mapped_column(
        SqlEnum(
            SupplyExportStatus,
            name="supply_export_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=SupplyExportStatus.DRAFT,
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    total_quantity: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)

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

    recipient_department: Mapped["Department | None"] = relationship("Department")
    created_by_user: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_user_id])
    approved_by_user: Mapped["User | None"] = relationship("User", foreign_keys=[approved_by_user_id])

    items: Mapped[list["SupplyExportItem"]] = relationship(
        "SupplyExportItem",
        back_populates="voucher",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"SupplyExportVoucher(id={self.id!r}, voucher_code={self.voucher_code!r}, status={self.status!r})"