from __future__ import annotations

from math import ceil
from typing import Any, Sequence


def build_pagination_meta(*, total: int, skip: int, limit: int) -> dict[str, int | bool]:
    """Build consistent pagination metadata for list endpoints."""
    safe_limit = max(limit, 1)
    current_page = (skip // safe_limit) + 1
    total_pages = ceil(total / safe_limit) if total else 1

    return {
        "total": total,
        "skip": skip,
        "limit": safe_limit,
        "current_page": current_page,
        "total_pages": total_pages,
        "has_next": skip + safe_limit < total,
        "has_previous": skip > 0,
    }


def paginate_items(
    items: Sequence[Any],
    *,
    total: int,
    skip: int,
    limit: int,
) -> dict[str, Any]:
    """Return a simple paginated response payload."""
    return {
        "items": list(items),
        "meta": build_pagination_meta(total=total, skip=skip, limit=limit),
    }
