from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum as SqlEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.maintenance import Maintenance
    from app.models.user import User


class WarrantyStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WarrantyTicket(Base):
    __tablename__ = "warranty_tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    warranty_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    maintenance_id: Mapped[int | None] = mapped_column(
        ForeignKey("maintenances.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    handled_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)

    warranty_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sent_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    received_back_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[WarrantyStatus] = mapped_column(
        SqlEnum(
            WarrantyStatus,
            name="warranty_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=WarrantyStatus.DRAFT,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    asset: Mapped["Asset"] = relationship("Asset")
    maintenance: Mapped["Maintenance | None"] = relationship("Maintenance")
    created_by_user: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_user_id])
    handled_by_user: Mapped["User | None"] = relationship("User", foreign_keys=[handled_by_user_id])