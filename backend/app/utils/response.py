from __future__ import annotations

from typing import Any


def success_response(
    *,
    message: str,
    data: Any = None,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a consistent success response envelope."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": meta or {},
    }


def created_response(
    *,
    message: str,
    data: Any = None,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Alias for success responses used on create operations."""
    return success_response(message=message, data=data, meta=meta)


def error_response(
    *,
    message: str,
    errors: list[str] | None = None,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a consistent error response payload for custom handlers."""
    return {
        "success": False,
        "message": message,
        "errors": errors or [],
        "meta": meta or {},
    }
