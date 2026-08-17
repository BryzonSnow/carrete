from __future__ import annotations

import re
import secrets
import unicodedata

_ACCENTS = str.maketrans(
    {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
        "à": "a",
        "è": "e",
        "ì": "i",
        "ò": "o",
        "ù": "u",
    }
)
_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"


def from_name(name: str) -> str:
    s = unicodedata.normalize("NFC", name).strip().lower().translate(_ACCENTS)
    parts: list[str] = []
    buf: list[str] = []
    for ch in s:
        if ch.isalnum():
            buf.append(ch)
        elif buf:
            parts.append("".join(buf))
            buf = []
    if buf:
        parts.append("".join(buf))
    base = "-".join(parts).strip("-")
    base = re.sub(r"-{2,}", "-", base)[:28].strip("-")
    if not base:
        base = "carrete"
    return f"{base}-{''.join(secrets.choice(_ALPHABET) for _ in range(5))}"


def token(n_bytes: int = 16) -> str:
    return secrets.token_hex(n_bytes)
