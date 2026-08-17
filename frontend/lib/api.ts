import type { CreateEventInput, EventPayload, RSVP } from "./types";
import { getAdminToken, getGuestToken, setGuestToken } from "./storage";

function apiBase() {
  const env = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  if (typeof window === "undefined") return env;
  try {
    const host = new URL(env).hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
  } catch {
    /* use env */
  }
  return env;
}

async function request<T>(
  path: string,
  slug: string | null,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (slug) {
    const guest = getGuestToken(slug);
    const admin = getAdminToken(slug);
    if (guest) headers.set("X-Guest-Token", guest);
    if (admin) headers.set("X-Admin-Token", admin);
  }
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Algo salió mal");
  }
  return data as T;
}

export async function createEvent(input: CreateEventInput) {
  return request<{ slug: string; admin_token: string }>("/api/events", null, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchEvent(slug: string) {
  return request<EventPayload>(`/api/events/${slug}`, slug);
}

export async function lookupAdmin(token: string) {
  return request<{ slug: string; admin_token: string }>(`/api/admin/${token}`, null);
}

export async function joinEvent(slug: string, displayName: string, rsvp?: RSVP) {
  const data = await request<{ session_token: string; payload: EventPayload }>(
    `/api/events/${slug}/join`,
    slug,
    {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        ...(rsvp ? { rsvp } : {}),
      }),
    },
  );
  setGuestToken(slug, data.session_token);
  return data.payload;
}

export async function setRsvp(slug: string, rsvp: RSVP) {
  return request<EventPayload>(`/api/events/${slug}/rsvp`, slug, {
    method: "PUT",
    body: JSON.stringify({ rsvp }),
  });
}

export async function addItem(
  slug: string,
  item: { category?: string; name: string; unit?: string; required_qty?: number; is_open?: boolean },
) {
  return request<EventPayload>(`/api/events/${slug}/items`, slug, {
    method: "POST",
    body: JSON.stringify({
      category: item.category || "Aportes",
      name: item.name,
      unit: item.unit || "",
      required_qty: item.required_qty ?? 1,
      is_open: true,
    }),
  });
}

export async function deleteItem(slug: string, itemId: string) {
  return request<EventPayload>(`/api/events/${slug}/items/${itemId}`, slug, {
    method: "DELETE",
  });
}

export async function markTransfer(slug: string, marked: boolean) {
  return request<EventPayload>(`/api/events/${slug}/transfer`, slug, {
    method: "POST",
    body: JSON.stringify({ marked }),
  });
}

export async function validatePayment(slug: string, guestId: string, validated: boolean) {
  return request<EventPayload>(`/api/events/${slug}/payments/${guestId}/validate`, slug, {
    method: "POST",
    body: JSON.stringify({ validated }),
  });
}
