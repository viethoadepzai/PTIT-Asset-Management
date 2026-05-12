from __future__ import annotations

import re

_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(value: str) -> str:
    """Trim and collapse internal whitespace for required text fields."""
    normalized = _WHITESPACE_RE.sub(" ", value.strip())
    return normalized


def normalize_optional_text(value: str | None) -> str | None:
    """Normalize optional text or return None when empty."""
    if value is None:
        return None
    normalized = normalize_text(value)
    return normalized or None


def normalize_email(value: str) -> str:
    """Trim, lowercase, and collapse whitespace in email values."""
    return normalize_text(value).lower()


def normalize_phone_number(value: str | None) -> str | None:
    """Keep digits and an optional leading '+' for phone numbers."""
    if value is None:
        return None

    raw = normalize_text(value)
    if not raw:
        return None

    has_plus_prefix = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None

    return f"+{digits}" if has_plus_prefix else digits
