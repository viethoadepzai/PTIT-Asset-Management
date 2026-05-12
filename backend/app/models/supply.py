from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.department import Department


class Supply(Base):
    """Consumable supply managed by PTIT, such as paper, ink, cables, or lab materials."""

    __tablename__ = "supplies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    supply_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="item", nullable=False)
    quantity_in_stock: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=0, nullable=False
    )
    minimum_stock_level: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=0, nullable=False
    )
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    managed_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("category.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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

    managed_department: Mapped["Department | None"] = relationship("Department")
    category: Mapped["Category | None"] = relationship("Category")

    def __repr__(self) -> str:
        return (
            f"Supply(id={self.id!r}, supply_code={self.supply_code!r}, "
            f"quantity_in_stock={self.quantity_in_stock!r})"
        )
