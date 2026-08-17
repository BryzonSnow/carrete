import os

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql://carrete:carrete@127.0.0.1:5433/carrete")
os.environ.setdefault("CORS_ORIGIN", "http://localhost:3000")

from app.config import settings

settings.cache_clear()

from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
