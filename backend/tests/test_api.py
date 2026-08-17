from datetime import datetime, timedelta, timezone


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["ok"] == "true"


def test_event_not_found(client):
    res = client.get("/api/events/no-existe-xyz")
    assert res.status_code == 404
    assert "carrete" in res.json()["error"]


def test_carrete_flow(client):
    starts = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=23, minute=0, second=0, microsecond=0)
    created = client.post(
        "/api/events",
        json={
            "name": "Asado sábado",
            "host_name": "Nico",
            "starts_at": starts.isoformat(),
            "address": "Lo Barnechea 123",
            "fee_amount": 5000,
            "bank_holder": "Nicolás Pérez",
            "bank_rut": "12.345.678-9",
            "bank_name": "BancoEstado",
            "bank_account_type": "Cuenta Vista",
            "bank_account_number": "12345678",
            "items": [],
        },
    )
    assert created.status_code == 201, created.text
    slug = created.json()["slug"]
    admin = created.json()["admin_token"]

    guest_view = client.get(f"/api/events/{slug}")
    assert guest_view.status_code == 200
    body = guest_view.json()
    assert body["event"]["name"] == "Asado sábado"
    assert body["event"]["address"] is None
    assert body["event"]["address_locked"] is True
    assert body["event"]["bank"] is None
    assert body["items"] == []

    joined = client.post(f"/api/events/{slug}/join", json={"display_name": "Cami"})
    assert joined.status_code == 200, joined.text
    token = joined.json()["session_token"]
    headers = {"X-Guest-Token": token}

    payload = joined.json()["payload"]
    assert payload["me"]["display_name"] == "Cami"
    assert payload["event"]["address_locked"] is True

    rsvp = client.put(f"/api/events/{slug}/rsvp", headers=headers, json={"rsvp": "going"})
    assert rsvp.status_code == 200
    payload = rsvp.json()
    assert payload["me"]["rsvp"] == "going"
    assert payload["event"]["address"] == "Lo Barnechea 123"
    assert payload["event"]["bank"]["rut"] == "12.345.678-9"
    assert payload["stats"]["going"] == 1
    assert payload["stats"]["fee_goal"] == 5000

    added = client.post(
        f"/api/events/{slug}/items",
        headers=headers,
        json={"name": "Pan amasado", "unit": "casero"},
    )
    assert added.status_code == 200
    extras = [i for i in added.json()["items"] if i["name"] == "Pan amasado"]
    assert extras and extras[0]["is_open"] is True
    assert extras[0]["claims"][0]["guest_name"] == "Cami"

    removed = client.delete(f"/api/events/{slug}/items/{extras[0]['id']}", headers=headers)
    assert removed.status_code == 200
    assert all(i["name"] != "Pan amasado" for i in removed.json()["items"])

    paid = client.post(f"/api/events/{slug}/transfer", headers=headers, json={"marked": True})
    assert paid.status_code == 200
    assert paid.json()["me"]["marked_at"]

    admin_headers = {"X-Admin-Token": admin, "X-Guest-Token": token}
    guest_id = paid.json()["me"]["id"]
    validated = client.post(
        f"/api/events/{slug}/payments/{guest_id}/validate",
        headers=admin_headers,
        json={"validated": True},
    )
    assert validated.status_code == 200
    assert validated.json()["is_admin"] is True
    assert validated.json()["stats"]["fee_validated"] == 5000
    assert validated.json()["guests"][0]["validated_at"]


def test_host_joins_going(client):
    starts = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=23, minute=0, second=0, microsecond=0)
    created = client.post(
        "/api/events",
        json={
            "name": "Once",
            "host_name": "Cami",
            "starts_at": starts.isoformat(),
        },
    )
    assert created.status_code == 201, created.text
    slug = created.json()["slug"]
    joined = client.post(f"/api/events/{slug}/join", json={"display_name": "Cami", "rsvp": "going"})
    assert joined.status_code == 200, joined.text
    payload = joined.json()["payload"]
    assert payload["me"]["rsvp"] == "going"
    assert payload["stats"]["going"] == 1
