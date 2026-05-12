from __future__ import annotations

import re
from datetime import datetime

_SUFFIX_RE = re.compile(r"(\d+)$")


def generate_prefixed_code(
    prefix: str,
    sequence: int,
    *,
    width: int = 5,
    separator: str = "",
) -> str:
    """Generate a business code like AS00001 or PB-00001."""
    normalized_prefix = prefix.strip().upper()
    return f"{normalized_prefix}{separator}{sequence:0{width}d}"


def generate_next_code(
    prefix: str,
    last_code: str | None,
    *,
    width: int = 5,
    separator: str = "",
) -> str:
    """Generate the next sequential code from the last known code."""
    if last_code is None:
        return generate_prefixed_code(prefix, 1, width=width, separator=separator)

    match = _SUFFIX_RE.search(last_code.strip())
    next_sequence = int(match.group(1)) + 1 if match else 1
    return generate_prefixed_code(prefix, next_sequence, width=width, separator=separator)


def generate_timestamped_code(prefix: str, *, dt: datetime | None = None) -> str:
    """Generate a code with a UTC timestamp for quick prototyping or imports."""
    current = dt or datetime.utcnow()
    return f"{prefix.strip().upper()}{current.strftime('%Y%m%d%H%M%S')}"
