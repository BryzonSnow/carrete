from __future__ import annotations

from pathlib import Path

import psycopg
from psycopg import ClientCursor
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import settings

pool: ConnectionPool | None = None


def _schema_path() -> Path:
    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent / "schema.sql",
        here.parents[2] / "supabase" / "schema.local.sql",
    ]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("schema.sql not found (looked in backend/ and supabase/)")


def connect() -> ConnectionPool:
    global pool
    url = settings()["database_url"]
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    apply_schema(url)
    pool = ConnectionPool(
        conninfo=url,
        min_size=1,
        max_size=10,
        kwargs={"row_factory": dict_row, "autocommit": True},
        open=True,
    )
    pool.wait(timeout=15)
    return pool


def apply_schema(url: str) -> None:
    sql = _schema_path().read_text(encoding="utf-8")
    with psycopg.connect(url, autocommit=True, cursor_factory=ClientCursor) as conn:
        conn.execute(sql)


def get_pool() -> ConnectionPool:
    if pool is None:
        raise RuntimeError("database pool is not ready")
    return pool


def close() -> None:
    global pool
    if pool is not None:
        pool.close()
        pool = None
