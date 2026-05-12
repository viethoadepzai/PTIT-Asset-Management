from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.category import CategoryNeed


class Department(Base):
    """Department/unit inside PTIT that owns users and assets."""

    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="department",
        cascade="save-update, merge",
    )
    needs: Mapped[list["CategoryNeed"]] = relationship(
        "CategoryNeed",
        back_populates="department",
        cascade="save-update, merge",
    )

    def __repr__(self) -> str:
        return f"Department(id={self.id!r}, code={self.code!r}, name={self.name!r})"
