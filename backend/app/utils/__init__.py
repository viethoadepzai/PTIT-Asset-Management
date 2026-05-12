"""Utility helpers shared across the PTIT asset management backend."""

from app.utils.code_generator import generate_next_code, generate_prefixed_code
from app.utils.normalizers import (
    normalize_email,
    normalize_optional_text,
    normalize_phone_number,
    normalize_text,
)
from app.utils.pagination import build_pagination_meta, paginate_items
from app.utils.response import created_response, error_response, success_response
from app.utils.validators import (
    ensure_end_date_not_before_start_date,
    ensure_exactly_one_provided,
    ensure_non_negative_number,
    ensure_positive_number,
)

__all__ = [
    "build_pagination_meta",
    "created_response",
    "ensure_end_date_not_before_start_date",
    "ensure_exactly_one_provided",
    "ensure_non_negative_number",
    "ensure_positive_number",
    "error_response",
    "generate_next_code",
    "generate_prefixed_code",
    "normalize_email",
    "normalize_optional_text",
    "normalize_phone_number",
    "normalize_text",
    "paginate_items",
    "success_response",
]
