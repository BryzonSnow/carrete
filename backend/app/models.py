from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def _id(value: Any) -> str:
    if isinstance(value, UUID):
        return str(value)
    return str(value)


class CreateItemInput(BaseModel):
    category: str = ""
    name: str
    unit: str = "un"
    required_qty: int = 1
    is_open: bool = False


class CreateEventInput(BaseModel):
    name: str
    host_name: str = ""
    starts_at: datetime
    address: str = ""
    fee_amount: int = 0
    bank_holder: str = ""
    bank_rut: str = ""
    bank_name: str = ""
    bank_account_type: str = ""
    bank_account_number: str = ""
    items: list[CreateItemInput] = Field(default_factory=list)


class CreateEventResponse(BaseModel):
    slug: str
    admin_token: str


class BankDetails(BaseModel):
    holder: str
    rut: str
    bank_name: str
    account_type: str
    account_number: str


class GuestOut(BaseModel):
    model_config = ConfigDict(ser_json_timedelta="iso8601")

    id: str
    event_id: str
    display_name: str
    rsvp: str
    created_at: datetime
    marked_at: datetime | None = None
    validated_at: datetime | None = None


class ItemClaim(BaseModel):
    guest_id: str
    guest_name: str
    qty: int


class ItemOut(BaseModel):
    id: str
    event_id: str
    category: str
    name: str
    unit: str
    required_qty: int
    committed_qty: int = 0
    is_open: bool
    created_by_guest_id: str | None = None
    sort_order: int
    claims: list[ItemClaim] = Field(default_factory=list)


class PublicEvent(BaseModel):
    id: str
    slug: str
    name: str
    host_name: str
    starts_at: datetime
    address: str | None = None
    address_locked: bool = False
    fee_amount: int
    bank: BankDetails | None = None


class Stats(BaseModel):
    going: int = 0
    late: int = 0
    not_going: int = 0
    pending: int = 0
    payers: int = 0
    fee_goal: int = 0
    fee_marked: int = 0
    fee_validated: int = 0


class EventPayload(BaseModel):
    event: PublicEvent
    me: GuestOut | None
    is_admin: bool
    guests: list[GuestOut]
    items: list[ItemOut]
    stats: Stats


def guest_from_row(row: dict, *, hide_payment: bool = False) -> GuestOut:
    return GuestOut(
        id=_id(row["id"]),
        event_id=_id(row["event_id"]),
        display_name=row["display_name"],
        rsvp=row["rsvp"],
        created_at=row["created_at"],
        marked_at=None if hide_payment else row.get("marked_at"),
        validated_at=None if hide_payment else row.get("validated_at"),
    )


def can_see_private(is_admin: bool, me: GuestOut | None) -> bool:
    if is_admin:
        return True
    if me is None:
        return False
    return me.rsvp in ("going", "late")


def to_public(event: dict, is_admin: bool, me: GuestOut | None) -> PublicEvent:
    address = event.get("address")
    pub = PublicEvent(
        id=_id(event["id"]),
        slug=event["slug"],
        name=event["name"],
        host_name=event["host_name"] or "",
        starts_at=event["starts_at"],
        fee_amount=event["fee_amount"] or 0,
        address=None,
        address_locked=False,
        bank=None,
    )
    if can_see_private(is_admin, me):
        pub.address = address
        holder = event.get("bank_holder") or ""
        rut = event.get("bank_rut") or ""
        number = event.get("bank_account_number") or ""
        if holder or rut or number:
            pub.bank = BankDetails(
                holder=holder,
                rut=rut,
                bank_name=event.get("bank_name") or "",
                account_type=event.get("bank_account_type") or "",
                account_number=number,
            )
    elif address:
        pub.address_locked = True
    return pub


def compute_stats(event: dict, guests: list[GuestOut]) -> Stats:
    stats = Stats()
    fee = event.get("fee_amount") or 0
    for g in guests:
        if g.rsvp == "going":
            stats.going += 1
        elif g.rsvp == "late":
            stats.late += 1
        elif g.rsvp == "not_going":
            stats.not_going += 1
        else:
            stats.pending += 1
        if g.rsvp in ("going", "late"):
            stats.payers += 1
            if g.marked_at:
                stats.fee_marked += fee
            if g.validated_at:
                stats.fee_validated += fee
    stats.fee_goal = fee * stats.payers
    return stats
