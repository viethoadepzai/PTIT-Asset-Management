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
    from app.models.user import User


class MaintenanceStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MaintenanceType(str, Enum):
    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"
    INSPECTION = "inspection"
    WARRANTY = "warranty"
    OTHER = "other"


class Maintenance(Base):
    """Maintenance record for fixed assets."""

    __tablename__ = "maintenances"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    maintenance_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    maintenance_type: Mapped[MaintenanceType] = mapped_column(
        SqlEnum(
            MaintenanceType,
            name="maintenance_type",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=MaintenanceType.CORRECTIVE,
        nullable=False,
    )

    status: Mapped[MaintenanceStatus] = mapped_column(
        SqlEnum(
            MaintenanceStatus,
            name="maintenance_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=MaintenanceStatus.SCHEDULED,
        nullable=False,
    )

    priority: Mapped[MaintenancePriority] = mapped_column(
        SqlEnum(
            MaintenancePriority,
            name="maintenance_priority",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=MaintenancePriority.MEDIUM,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    next_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    reported_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_to_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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

    asset: Mapped["Asset"] = relationship("Asset")
    reported_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[reported_by_user_id],
    )
    assigned_to_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to_user_id],
    )

    def __repr__(self) -> str:
        return (
            f"Maintenance(id={self.id!r}, maintenance_code={self.maintenance_code!r}, "
            f"maintenance_type={self.maintenance_type!r}, "
            f"status={self.status!r}, priority={self.priority!r})"
        )