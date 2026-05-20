from __future__ import annotations

import re
import unicodedata
from typing import Any

ARABIC_RANGES: tuple[tuple[int, int], ...] = (
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0x08A0, 0x08FF),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF),
)

ALLOWED_PUNCTUATION = set("-_.,;:/()[]{}'\"&+")


def _is_arabic_script(ch: str) -> bool:
    codepoint = ord(ch)
    return any(start <= codepoint <= end for start, end in ARABIC_RANGES)


def _is_latin_letter(ch: str) -> bool:
    return "LATIN" in unicodedata.name(ch, "")


def sanitize_latin_arabic_text(value: Any) -> str:
    text = "" if value is None else str(value)
    if not text:
        return ""

    cleaned = []
    for ch in text:
        if ch.isspace() or ch.isdigit() or ch in ALLOWED_PUNCTUATION:
            cleaned.append(ch)
            continue
        if _is_arabic_script(ch) or _is_latin_letter(ch):
            cleaned.append(ch)

    compact = "".join(cleaned)
    compact = re.sub(r"\s+", " ", compact).strip()
    compact = re.sub(r"\s*-\s*", " - ", compact)
    return re.sub(r"\s+", " ", compact).strip(" -")
