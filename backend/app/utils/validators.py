from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status


Number = int | float | Decimal


def ensure_positive_number(
    value: Number,
    *,
    field_name: str,
    error_message: str | None = None,
) -> Number:
    """Ensure a numeric value is greater than zero."""
    if value <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message or f"{field_name} must be greater than 0",
        )
    return value


def ensure_non_negative_number(
    value: Number,
    *,
    field_name: str,
    error_message: str | None = None,
) -> Number:
    """Ensure a numeric value is zero or greater."""
    if value < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message or f"{field_name} must be greater than or equal to 0",
        )
    return value


def ensure_end_date_not_before_start_date(
    start_date: date | datetime | None,
    end_date: date | datetime | None,
    *,
    start_field_name: str = "start date",
    end_field_name: str = "end date",
) -> None:
    """Validate date ranges used in allocations, maintenance, or reports."""
    if start_date is None or end_date is None:
        return

    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{end_field_name.title()} cannot be earlier than {start_field_name}",
        )


def ensure_exactly_one_provided(
    *,
    values: dict[str, Any],
    detail: str | None = None,
) -> str:
    """Ensure exactly one field in a mapping has a non-empty value.

    Returns the selected field name.
    """
    provided = [key for key, value in values.items() if value not in (None, "", [], {}, ())]
    if len(provided) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail or f"Exactly one of these fields must be provided: {', '.join(values.keys())}",
        )
    return provided[0]
