from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.asset_loan_voucher import AssetLoanVoucher


class AssetLoanItem(Base):
    __tablename__ = "asset_loan_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    voucher_id: Mapped[int] = mapped_column(
        ForeignKey("asset_loan_vouchers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[int | None] = mapped_column(
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    asset_code_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)
    asset_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_before_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)
    condition_after_return: Mapped[str | None] = mapped_column(String(50), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    voucher: Mapped["AssetLoanVoucher"] = relationship("AssetLoanVoucher", back_populates="items")
    asset: Mapped["Asset | None"] = relationship("Asset")