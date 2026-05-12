from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.supply import Supply
    from app.models.supply_export_voucher import SupplyExportVoucher


class SupplyExportItem(Base):
    __tablename__ = "supply_export_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    voucher_id: Mapped[int] = mapped_column(
        ForeignKey("supply_export_vouchers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    supply_id: Mapped[int | None] = mapped_column(
        ForeignKey("supplies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    supply_code_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)
    supply_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)

    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    voucher: Mapped["SupplyExportVoucher"] = relationship("SupplyExportVoucher", back_populates="items")
    supply: Mapped["Supply | None"] = relationship("Supply")

    def __repr__(self) -> str:
        return f"SupplyExportItem(id={self.id!r}, voucher_id={self.voucher_id!r}, quantity={self.quantity!r})"