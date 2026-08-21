from __future__ import annotations

from psycopg_pool import ConnectionPool

from . import slug
from .errors import Forbidden, NotFound, ValidationErr
from .models import (
    CreateEventInput,
    CreateEventResponse,
    CreateItemInput,
    EventPayload,
    GuestOut,
    ItemClaim,
    ItemOut,
    compute_stats,
    apply_host_flags,
    guest_from_row,
    to_public,
    _id,
)


class Store:
    def __init__(self, pool: ConnectionPool):
        self.pool = pool

    def create_event(self, data: CreateEventInput) -> CreateEventResponse:
        name = data.name.strip()
        if not name:
            raise ValidationErr("el nombre del carrete es obligatorio")
        if data.fee_amount < 0:
            raise ValidationErr("la cuota no puede ser negativa")

        admin_token = slug.token(16)
        event_slug = slug.from_name(name)

        with self.pool.connection() as conn:
            with conn.transaction():
                row = conn.execute(
                    """
                    insert into events (
                        slug, name, host_name, starts_at, address, fee_amount,
                        bank_holder, bank_rut, bank_name, bank_account_type, bank_account_number,
                        admin_token
                    ) values (%s,%s,%s,%s,nullif(%s,''),%s,nullif(%s,''),nullif(%s,''),nullif(%s,''),nullif(%s,''),nullif(%s,''),%s)
                    returning id
                    """,
                    (
                        event_slug,
                        name,
                        data.host_name.strip(),
                        data.starts_at,
                        data.address.strip(),
                        data.fee_amount,
                        data.bank_holder.strip(),
                        data.bank_rut.strip(),
                        data.bank_name.strip(),
                        data.bank_account_type.strip(),
                        data.bank_account_number.strip(),
                        admin_token,
                    ),
                ).fetchone()
                event_id = row["id"]
                for i, item in enumerate(data.items):
                    item_name = item.name.strip()
                    if not item_name:
                        continue
                    conn.execute(
                        """
                        insert into items (event_id, category, name, unit, required_qty, is_open, sort_order)
                        values (%s,%s,%s,%s,%s,false,%s)
                        """,
                        (
                            event_id,
                            item.category.strip() or "General",
                            item_name,
                            item.unit.strip() or "un",
                            max(item.required_qty, 0),
                            i,
                        ),
                    )
        return CreateEventResponse(slug=event_slug, admin_token=admin_token)

    def event_by_slug(self, event_slug: str) -> dict:
        return self._event("where slug = %s", event_slug)

    def event_by_admin_token(self, token: str) -> dict:
        return self._event("where admin_token = %s", token)

    def _event(self, where: str, arg: str) -> dict:
        with self.pool.connection() as conn:
            row = conn.execute(
                f"""
                select id, slug, name, host_name, starts_at, address, fee_amount,
                       bank_holder, bank_rut, bank_name, bank_account_type, bank_account_number,
                       admin_token, created_at
                from events {where}
                """,
                (arg,),
            ).fetchone()
        if not row:
            raise NotFound()
        return row

    def guests(self, event_id) -> list[GuestOut]:
        with self.pool.connection() as conn:
            rows = conn.execute(
                """
                select g.id, g.event_id, g.display_name, g.session_token, g.rsvp, g.created_at,
                       p.marked_at, p.validated_at
                from guests g
                left join payments p on p.guest_id = g.id and p.event_id = g.event_id
                where g.event_id = %s
                order by g.created_at asc
                """,
                (event_id,),
            ).fetchall()
        return [guest_from_row(r) for r in rows]

    def guest_by_token(self, event_id, token: str) -> tuple[GuestOut, str] | None:
        if not token:
            return None
        with self.pool.connection() as conn:
            row = conn.execute(
                """
                select g.id, g.event_id, g.display_name, g.session_token, g.rsvp, g.created_at,
                       p.marked_at, p.validated_at
                from guests g
                left join payments p on p.guest_id = g.id and p.event_id = g.event_id
                where g.event_id = %s and g.session_token = %s
                """,
                (event_id, token),
            ).fetchone()
        if not row:
            return None
        return guest_from_row(row), row["session_token"]

    def items(self, event_id) -> list[ItemOut]:
        with self.pool.connection() as conn:
            rows = conn.execute(
                """
                select id, event_id, category, name, unit, required_qty, is_open, created_by_guest_id, sort_order
                from items
                where event_id = %s
                order by sort_order asc, created_at asc
                """,
                (event_id,),
            ).fetchall()
            if not rows:
                return []
            claims = conn.execute(
                """
                select c.item_id, c.guest_id, g.display_name, c.qty
                from item_claims c
                join items i on i.id = c.item_id
                join guests g on g.id = c.guest_id
                where i.event_id = %s
                order by c.created_at asc
                """,
                (event_id,),
            ).fetchall()

        out: list[ItemOut] = []
        index: dict[str, int] = {}
        for row in rows:
            item = ItemOut(
                id=_id(row["id"]),
                event_id=_id(row["event_id"]),
                category=row["category"],
                name=row["name"],
                unit=row["unit"],
                required_qty=row["required_qty"],
                is_open=row["is_open"],
                created_by_guest_id=_id(row["created_by_guest_id"]) if row["created_by_guest_id"] else None,
                sort_order=row["sort_order"],
                claims=[],
                committed_qty=0,
            )
            index[item.id] = len(out)
            out.append(item)
        for c in claims:
            item_id = _id(c["item_id"])
            idx = index.get(item_id)
            if idx is None:
                continue
            out[idx].claims.append(
                ItemClaim(guest_id=_id(c["guest_id"]), guest_name=c["display_name"], qty=c["qty"])
            )
            out[idx].committed_qty += c["qty"]
        return out

    def join(self, event_id, display_name: str, existing_token: str, rsvp: str | None = None) -> tuple[GuestOut, str]:
        display_name = display_name.strip()
        if not display_name:
            raise ValidationErr("el nombre es obligatorio")
        rsvp_value = None
        if rsvp:
            if rsvp not in ("going", "not_going", "late"):
                raise ValidationErr("rsvp inválido")
            rsvp_value = rsvp
        if existing_token:
            found = self.guest_by_token(event_id, existing_token)
            if found:
                guest, token = found
                with self.pool.connection() as conn:
                    with conn.transaction():
                        if rsvp_value:
                            conn.execute(
                                "update guests set display_name = %s, rsvp = %s where id = %s",
                                (display_name, rsvp_value, guest.id),
                            )
                            guest.rsvp = rsvp_value
                        else:
                            conn.execute(
                                "update guests set display_name = %s where id = %s",
                                (display_name, guest.id),
                            )
                guest.display_name = display_name
                return guest, token
        token = slug.token(16)
        with self.pool.connection() as conn:
            with conn.transaction():
                row = conn.execute(
                    """
                    insert into guests (event_id, display_name, session_token, rsvp)
                    values (%s,%s,%s,%s)
                    returning id, event_id, display_name, session_token, rsvp, created_at
                    """,
                    (event_id, display_name, token, rsvp_value or "pending"),
                ).fetchone()
        row["marked_at"] = None
        row["validated_at"] = None
        return guest_from_row(row), token

    def set_rsvp(self, guest_id: str, rsvp: str) -> None:
        if rsvp not in ("going", "not_going", "late"):
            raise ValidationErr("rsvp inválido")
        with self.pool.connection() as conn:
            with conn.transaction():
                conn.execute("update guests set rsvp = %s where id = %s", (rsvp, guest_id))

    def add_item(self, event_id, data: CreateItemInput, guest_id: str | None) -> None:
        name = data.name.strip()
        if not name:
            raise ValidationErr("el nombre del ítem es obligatorio")
        if not guest_id:
            raise ValidationErr("entra con tu nombre primero")
        category = data.category.strip() or "Aportes"
        unit = data.unit.strip()
        qty = data.required_qty if data.required_qty >= 1 else 1
        with self.pool.connection() as conn:
            with conn.transaction():
                sort_row = conn.execute(
                    "select coalesce(max(sort_order), -1) + 1 as n from items where event_id = %s",
                    (event_id,),
                ).fetchone()
                row = conn.execute(
                    """
                    insert into items (event_id, category, name, unit, required_qty, is_open, created_by_guest_id, sort_order)
                    values (%s,%s,%s,%s,%s,true,%s,%s)
                    returning id
                    """,
                    (event_id, category, name, unit, qty, guest_id, sort_row["n"]),
                ).fetchone()
                self._claim(conn, row["id"], guest_id, qty, allow_over=True)

    def add_needed_item(self, event_id, data: CreateItemInput) -> None:
        name = data.name.strip()
        if not name:
            raise ValidationErr("el nombre del ítem es obligatorio")
        category = data.category.strip() or "Lista"
        unit = data.unit.strip() or "un"
        qty = data.required_qty if data.required_qty >= 1 else 1
        with self.pool.connection() as conn:
            with conn.transaction():
                sort_row = conn.execute(
                    "select coalesce(max(sort_order), -1) + 1 as n from items where event_id = %s",
                    (event_id,),
                ).fetchone()
                conn.execute(
                    """
                    insert into items (event_id, category, name, unit, required_qty, is_open, sort_order)
                    values (%s,%s,%s,%s,%s,false,%s)
                    """,
                    (event_id, category, name, unit, qty, sort_row["n"]),
                )

    def delete_item(self, item_id: str, guest_id: str | None, is_admin: bool) -> None:
        with self.pool.connection() as conn:
            with conn.transaction():
                row = conn.execute(
                    "select created_by_guest_id from items where id = %s",
                    (item_id,),
                ).fetchone()
                if not row:
                    raise NotFound()
                owner = str(row["created_by_guest_id"]) if row["created_by_guest_id"] else ""
                if not is_admin and owner != str(guest_id or ""):
                    raise Forbidden("solo puedes quitar lo que anotaste tú")
                conn.execute("delete from items where id = %s", (item_id,))

    def claim(self, item_id: str, guest_id: str, qty: int, allow_over: bool = False) -> None:
        if qty < 0:
            raise ValidationErr("cantidad inválida")
        with self.pool.connection() as conn:
            with conn.transaction():
                self._claim(conn, item_id, guest_id, qty, allow_over)

    def _claim(self, conn, item_id, guest_id, qty: int, allow_over: bool = False) -> None:
        item = conn.execute(
            "select event_id, required_qty, is_open from items where id = %s for update",
            (item_id,),
        ).fetchone()
        if not item:
            raise NotFound()
        if qty == 0:
            conn.execute(
                "delete from item_claims where item_id = %s and guest_id = %s",
                (item_id, guest_id),
            )
            return
        conn.execute(
            """
            insert into item_claims (item_id, guest_id, qty)
            values (%s,%s,%s)
            on conflict (item_id, guest_id) do update set qty = excluded.qty
            """,
            (item_id, guest_id, qty),
        )

    def mark_transferred(self, event_id, guest_id: str) -> None:
        with self.pool.connection() as conn:
            with conn.transaction():
                conn.execute(
                    """
                    insert into payments (event_id, guest_id, marked_at)
                    values (%s,%s,now())
                    on conflict (event_id, guest_id) do update
                      set marked_at = coalesce(payments.marked_at, now())
                    """,
                    (event_id, guest_id),
                )

    def unmark_transferred(self, event_id, guest_id: str) -> None:
        with self.pool.connection() as conn:
            with conn.transaction():
                conn.execute(
                    """
                    update payments
                    set marked_at = null
                    where event_id = %s and guest_id = %s and validated_at is null
                    """,
                    (event_id, guest_id),
                )

    def validate_payment(self, event_id, guest_id: str, validated: bool) -> None:
        with self.pool.connection() as conn:
            with conn.transaction():
                if validated:
                    conn.execute(
                        """
                        insert into payments (event_id, guest_id, marked_at, validated_at)
                        values (%s,%s,now(),now())
                        on conflict (event_id, guest_id) do update
                          set validated_at = now(),
                              marked_at = coalesce(payments.marked_at, now())
                        """,
                        (event_id, guest_id),
                    )
                else:
                    conn.execute(
                        "update payments set validated_at = null where event_id = %s and guest_id = %s",
                        (event_id, guest_id),
                    )

    def payload(self, event: dict, guest_token: str, admin_token: str) -> EventPayload:
        is_admin = bool(admin_token) and admin_token == event["admin_token"]
        guests = self.guests(event["id"])
        items = self.items(event["id"])
        found = self.guest_by_token(event["id"], guest_token)
        me = found[0] if found else None
        apply_host_flags(event, guests, me)
        stats = compute_stats(event, guests)
        if not is_admin:
            for g in guests:
                g.marked_at = None
                g.validated_at = None
        return EventPayload(
            event=to_public(event, is_admin, me),
            me=me,
            is_admin=is_admin,
            guests=guests,
            items=items,
            stats=stats,
        )
