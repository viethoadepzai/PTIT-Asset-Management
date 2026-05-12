from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.department import Department
    from app.models.supply import Supply
    from app.models.user import User


class AllocationType(str, Enum):
    ASSET = "asset"
    SUPPLY = "supply"


class AllocationStatus(str, Enum):
    REQUESTED = "requested"
    ACTIVE = "active"
    COMPLETED = "completed"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class Allocation(Base):
    """Allocation record for issuing assets or supplies to departments/users."""

    __tablename__ = "allocations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    allocation_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    allocation_type: Mapped[AllocationType] = mapped_column(
        SqlEnum(
            AllocationType,
            name="allocation_type",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
    )

    status: Mapped[AllocationStatus] = mapped_column(
        SqlEnum(
            AllocationStatus,
            name="allocation_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=AllocationStatus.ACTIVE,
        nullable=False,
    )

    asset_id: Mapped[int | None] = mapped_column(
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
    )
    supply_id: Mapped[int | None] = mapped_column(
        ForeignKey("supplies.id", ondelete="SET NULL"),
        nullable=True,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=1,
        nullable=False,
    )

    allocated_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    allocated_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    allocated_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expected_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    asset: Mapped["Asset | None"] = relationship("Asset")
    supply: Mapped["Supply | None"] = relationship("Supply")
    allocated_department: Mapped["Department | None"] = relationship(
        "Department",
        foreign_keys=[allocated_department_id],
    )
    allocated_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[allocated_user_id],
    )
    allocated_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[allocated_by_user_id],
    )

    def __repr__(self) -> str:
        return (
            f"Allocation(id={self.id!r}, allocation_code={self.allocation_code!r}, "
            f"allocation_type={self.allocation_type!r}, status={self.status!r})"
        )