from __future__ import annotations

import os
from functools import lru_cache
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


def _with_ssl(db: str) -> str:
    if not db or "sslmode=" in db:
        return db
    host = (urlparse(db).hostname or "").lower()
    local = host in {"localhost", "127.0.0.1", "db", "postgres"}
    sep = "&" if "?" in db else "?"
    return db + sep + ("sslmode=disable" if local else "sslmode=require")


@lru_cache
def settings() -> dict:
    origins = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    return {
        "port": int(os.getenv("PORT", "8080")),
        "database_url": _with_ssl(os.getenv("DATABASE_URL", "")),
        "cors_origins": [o.strip() for o in origins.split(",") if o.strip()],
    }
