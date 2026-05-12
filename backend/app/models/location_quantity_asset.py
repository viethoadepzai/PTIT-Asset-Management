from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum as SqlEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.asset_quantity import AssetQuantity


class LocationApprovalStatus(str, Enum):
    NOT_APPROVAL = "not_approval"
    PENDING = "pending"
    APPROVAL = "approval"


class LocationQuantityAsset(Base):
    """Vị trí lưu trữ của tài sản số lượng lớn."""

    __tablename__ = "location_quantity_assets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_code: Mapped[str] = mapped_column(
        String(50), nullable=False, default="KHO"
    )
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reason:  Mapped[str] = mapped_column(
        String(50), nullable=True
    )
    status_approval: Mapped[LocationApprovalStatus] = mapped_column(
        SqlEnum(
            LocationApprovalStatus,
            name="location_approval_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=LocationApprovalStatus.PENDING,
        nullable=False,
    )

    quantity_assets_id: Mapped[int | None] = mapped_column(
        ForeignKey("quantity_assets.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    quantity_asset: Mapped["AssetQuantity | None"] = relationship(
        "AssetQuantity", back_populates="locations"
    )

    def __repr__(self) -> str:
        return (
            f"LocationQuantityAsset(id={self.id!r}, room_code={self.room_code!r}, "
            f"quantity={self.quantity!r}, used={self.used!r}, "
            f"status_approval={self.status_approval!r})"
        )
