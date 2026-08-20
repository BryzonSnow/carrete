from __future__ import annotations

from contextlib import asynccontextmanager
from logging import getLogger
from typing import Annotated

from fastapi import Depends, FastAPI, Header, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings
from .db import close, connect, get_pool
from .errors import AppError, Unauthorized
from .models import CreateEventInput, CreateItemInput
from .store import Store


@asynccontextmanager
async def lifespan(_app: FastAPI):
    connect()
    yield
    close()


log = getLogger("carrete")
cfg = settings()
app = FastAPI(title="Carrete", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        ["*"]
        if "*" in cfg["cors_origins"]
        else list({*cfg["cors_origins"], "http://localhost:3000", "http://127.0.0.1:3000"})
    ),
    allow_origin_regex=r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+",
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "X-Guest-Token", "X-Admin-Token"],
    expose_headers=["X-Guest-Token"],
)


@app.exception_handler(AppError)
async def app_error_handler(_request, exc: AppError):
    return JSONResponse(status_code=exc.status, content={"error": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_handler(_request, _exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"error": "json inválido"})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    log.exception("unhandled error on %s %s", request.method, request.url.path)
    origin = request.headers.get("origin", "")
    resp = JSONResponse(status_code=500, content={"error": "algo salió mal"})
    if origin:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Expose-Headers"] = "X-Guest-Token"
    return resp


def store() -> Store:
    return Store(get_pool())


def guest_token(x_guest_token: Annotated[str | None, Header()] = None) -> str:
    return (x_guest_token or "").strip()


def admin_token(
    x_admin_token: Annotated[str | None, Header()] = None,
    admin_token_q: Annotated[str | None, Query(alias="admin_token")] = None,
) -> str:
    return (x_admin_token or admin_token_q or "").strip()


class JoinBody(BaseModel):
    display_name: str
    rsvp: str | None = None


class RsvpBody(BaseModel):
    rsvp: str


class ClaimBody(BaseModel):
    qty: int | None = 1


class TransferBody(BaseModel):
    marked: bool | None = True


class ValidateBody(BaseModel):
    validated: bool


@app.get("/health")
def health():
    return {"ok": "true"}


@app.post("/api/events", status_code=201)
def create_event(body: CreateEventInput, st: Store = Depends(store)):
    return st.create_event(body)


@app.get("/api/admin/{token}")
def admin_lookup(token: str, st: Store = Depends(store)):
    event = st.event_by_admin_token(token)
    return {"slug": event["slug"], "admin_token": event["admin_token"]}


@app.get("/api/events/{slug}")
def get_event(
    slug: str,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event = st.event_by_slug(slug)
    return st.payload(event, guest, admin)


@app.post("/api/events/{slug}/join")
def join(
    slug: str,
    body: JoinBody,
    response: Response,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event = st.event_by_slug(slug)
    me, token = st.join(event["id"], body.display_name, guest, body.rsvp)
    payload = st.payload(event, token, admin)
    response.headers["X-Guest-Token"] = token
    return {"session_token": token, "payload": payload}


@app.put("/api/events/{slug}/rsvp")
def rsvp(
    slug: str,
    body: RsvpBody,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event, me = _require_guest(st, slug, guest)
    st.set_rsvp(me.id, body.rsvp)
    return st.payload(event, guest, admin)


@app.post("/api/events/{slug}/items")
def add_item(
    slug: str,
    body: CreateItemInput,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event = st.event_by_slug(slug)
    found = st.guest_by_token(event["id"], guest)
    is_admin = admin != "" and admin == event["admin_token"]
    if found is None and not is_admin:
        raise Unauthorized()
    if is_admin and not body.is_open:
        st.add_needed_item(event["id"], body)
        return st.payload(event, guest, admin)
    if found is None:
        raise Unauthorized()
    st.add_item(event["id"], body, found[0].id)
    return st.payload(event, guest, admin)


@app.delete("/api/events/{slug}/items/{item_id}")
def delete_item(
    slug: str,
    item_id: str,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event = st.event_by_slug(slug)
    is_admin = admin != "" and admin == event["admin_token"]
    found = st.guest_by_token(event["id"], guest)
    if not is_admin and found is None:
        raise Unauthorized()
    st.delete_item(item_id, found[0].id if found else None, is_admin)
    return st.payload(event, guest, admin)


@app.put("/api/events/{slug}/items/{item_id}/claim")
def claim(
    slug: str,
    item_id: str,
    body: ClaimBody,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event, me = _require_guest(st, slug, guest)
    qty = 1 if body.qty is None else body.qty
    st.claim(item_id, me.id, qty, allow_over=False)
    return st.payload(event, guest, admin)


@app.post("/api/events/{slug}/transfer")
def transfer(
    slug: str,
    body: TransferBody,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event, me = _require_guest(st, slug, guest)
    if body.marked is False:
        st.unmark_transferred(event["id"], me.id)
    else:
        st.mark_transferred(event["id"], me.id)
    return st.payload(event, guest, admin)


@app.post("/api/events/{slug}/payments/{guest_id}/validate")
def validate_payment(
    slug: str,
    guest_id: str,
    body: ValidateBody,
    st: Store = Depends(store),
    guest: str = Depends(guest_token),
    admin: str = Depends(admin_token),
):
    event = st.event_by_slug(slug)
    if admin != event["admin_token"]:
        raise Unauthorized("link de admin inválido")
    st.validate_payment(event["id"], guest_id, body.validated)
    return st.payload(event, guest, admin)


def _require_guest(st: Store, slug: str, guest: str):
    event = st.event_by_slug(slug)
    found = st.guest_by_token(event["id"], guest)
    if found is None:
        raise Unauthorized()
    return event, found[0]
