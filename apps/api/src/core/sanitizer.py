import html
import re
from typing import Optional


def sanitize_text(value: Optional[str], max_length: int = 1000) -> Optional[str]:
    """Sanitizes user input by stripping HTML tags, trimming whitespace, and truncating length."""
    if value is None:
        return None
    # Strip dangerous HTML/script tags
    cleaned = re.sub(r"<[^>]*>", "", str(value))
    # Strip null bytes and control characters
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", cleaned)
    # Unescape HTML entities then re-escape safely if needed
    cleaned = html.escape(cleaned.strip())
    # Truncate to maximum length
    return cleaned[:max_length]


def sanitize_identifier(value: str, max_length: int = 100) -> str:
    """Sanitizes alphanumeric identifiers and keys."""
    if not value:
        return ""
    # Keep only safe alphanumeric, dashes, and underscores
    cleaned = re.sub(r"[^a-zA-Z0-9_\-\.@]", "", str(value))
    return cleaned[:max_length].strip()
