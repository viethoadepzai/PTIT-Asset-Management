from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum as SqlEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset_loan_item import AssetLoanItem
    from app.models.department import Department
    from app.models.user import User


class AssetLoanStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    RECEIVED = "received"
    RETURNED = "returned"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class AssetLoanVoucher(Base):
    __tablename__ = "asset_loan_vouchers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    voucher_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    borrower_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    borrower_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    loan_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[AssetLoanStatus] = mapped_column(
        SqlEnum(
            AssetLoanStatus,
            name="asset_loan_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=AssetLoanStatus.DRAFT,
        nullable=False,
    )

    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    borrower_department: Mapped["Department | None"] = relationship("Department")
    borrower_user: Mapped["User | None"] = relationship("User", foreign_keys=[borrower_user_id])
    approved_by_user: Mapped["User | None"] = relationship("User", foreign_keys=[approved_by_user_id])

    items: Mapped[list["AssetLoanItem"]] = relationship(
        "AssetLoanItem",
        back_populates="voucher",
        cascade="all, delete-orphan",
    )