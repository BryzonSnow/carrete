"use client";

import { validatePayment } from "@/lib/api";
import { formatWhen, origin } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import { HostModeBar } from "@/components/HostModeBar";
import { ItemPixelIcon, PixelAvatar } from "@/components/PixelArt";
import type { EventPayload, Guest, RSVP } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const RSVP_LABEL: Record<RSVP, string> = {
  going: "Voy",
  late: "Más tarde",
  not_going: "No va",
  pending: "Sin confirmar",
};

export function AdminPanel({
  slug,
  data,
  onUpdate,
}: {
  slug: string;
  data: EventPayload;
  onUpdate: (payload: EventPayload) => void;
}) {
  const { event, guests, stats } = data;
  const [guestUrl, setGuestUrl] = useState("");
  const [adminUrl, setAdminUrl] = useState("");

  useEffect(() => {
    const base = origin();
    setGuestUrl(`${base}/e/${slug}`);
    const token = localStorage.getItem(`carrete.admin.${slug}`) || "";
    setAdminUrl(token ? `${base}/a/${token}` : "");
  }, [slug]);

  const toReview = useMemo(
    () => guests.filter((g) => !g.is_host && (g.rsvp === "going" || g.rsvp === "late") && g.marked_at && !g.validated_at),
    [guests],
  );
  const payers = useMemo(
    () => guests.filter((g) => !g.is_host && (g.rsvp === "going" || g.rsvp === "late")),
    [guests],
  );
  const validatedCount = payers.filter((g) => g.validated_at).length;
  const needed = data.items.filter((item) => !item.is_open);
  const extras = data.items.filter((item) => item.is_open);
  const orderedGuests = useMemo(() => sortGuests(guests), [guests]);

  return (
    <div className="space-y-4">
      <HostModeBar slug={slug} surface="panel" />

      <section className="card border-[var(--gold)]/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Tu carrete</p>
        <h1 className="font-display mt-1 text-4xl">{event.name}</h1>
        <p className="mt-1 capitalize text-[var(--cream)]/85">{formatWhen(event.starts_at)}</p>
        {event.address ? <p className="mt-1 text-sm text-[var(--muted)]">{event.address}</p> : null}
        <div className="mt-4 grid gap-2">
          <CopyButton text={guestUrl} label="Copiar link para el grupo" copiedLabel="Link de invitados copiado" className="btn-primary w-full" />
          {adminUrl ? (
            <CopyButton
              text={adminUrl}
              label="Copiar link de este panel (no lo mandes al grupo)"
              copiedLabel="Link de admin copiado"
              className="btn-ghost w-full text-sm"
            />
          ) : null}
        </div>
      </section>

      {toReview.length > 0 ? (
        <section className="card border-[var(--gold)] bg-[var(--gold)]/12 p-4 sm:p-5">
          <h2 className="font-display text-2xl text-[var(--gold)]">
            {toReview.length === 1 ? "1 transferencia por validar" : `${toReview.length} transferencias por validar`}
          </h2>
          <p className="mt-1 text-sm text-[var(--cream)]/80">Toca validar cuando te llegue la plata.</p>
          <ul className="mt-4 space-y-2">
            {toReview.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#1a0c04]/40 px-3 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <PixelAvatar seed={g.display_name} size={36} />
                  <span className="font-medium">{g.display_name}</span>
                </span>
                <button
                  type="button"
                  className="btn-primary shrink-0 px-4"
                  onClick={() => void validatePayment(slug, g.id, true).then(onUpdate)}
                >
                  Validar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Van" value={stats.going + stats.late} />
        <Stat label="No van" value={stats.not_going} />
        {event.fee_amount > 0 ? (
          <>
            <Stat label="Validados" value={`${validatedCount}/${payers.length}`} />
            <Stat label="Por validar" value={toReview.length} highlight={toReview.length > 0} />
          </>
        ) : (
          <>
            <Stat label="Aportes" value={data.items.length} />
            <Stat label="Sin confirmar" value={stats.pending} />
          </>
        )}
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-2xl">Invitados</h2>
          <p className="text-sm text-[var(--muted)]">Quién vai y, si hay cuota, quién ya pagó.</p>
        </div>
        <ul>
          {orderedGuests.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">Todavía nadie entra al link.</li>
          ) : (
            orderedGuests.map((g) => (
              <GuestRow key={g.id} guest={g} slug={slug} hasFee={event.fee_amount > 0} onUpdate={onUpdate} />
            ))
          )}
        </ul>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-2xl">Qué hay que llevar</h2>
        </div>
        <ul>
          {needed.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">No armaste lista. Los invitados igual pueden anotar extras.</li>
          ) : (
            needed.map((item) => {
              const taken = item.claims.length > 0;
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0">
                  <p className="flex min-w-0 items-center gap-3 font-medium">
                    <ItemPixelIcon name={item.name} size={24} />
                    <span>{item.name}</span>
                  </p>
                  <span className={`text-right text-sm ${taken ? "text-[var(--ok)]" : "text-[var(--gold)]"}`}>
                    {taken ? item.claims.map((c) => c.guest_name).join(", ") : "Nadie aún"}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-2xl">Extras</h2>
        </div>
        <ul>
          {extras.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">Nadie anotó algo extra todavía.</li>
          ) : (
            extras.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0">
                <p className="flex min-w-0 items-center gap-3 font-medium">
                  <ItemPixelIcon name={item.name} size={24} />
                  <span>{item.name}</span>
                </p>
                <span className="text-sm text-[var(--muted)]">{item.claims[0]?.guest_name || "—"}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function GuestRow({
  guest: g,
  slug,
  hasFee,
  onUpdate,
}: {
  guest: Guest;
  slug: string;
  hasFee: boolean;
  onUpdate: (payload: EventPayload) => void;
}) {
  const going = g.rsvp === "going" || g.rsvp === "late";

  return (
    <li
      className={`flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0 ${
        g.is_host
          ? "bg-[var(--gold)]/8"
          : g.marked_at && !g.validated_at
            ? "bg-[var(--gold)]/10"
            : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PixelAvatar seed={g.display_name} size={36} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {g.display_name}
            {g.is_host ? (
              <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1a0c04]">
                Tú
              </span>
            ) : null}
          </p>
          <RsvpPill rsvp={g.rsvp} />
        </div>
      </div>
      {g.is_host ? (
        <span className="shrink-0 text-xs text-[var(--muted)]">No transfiere</span>
      ) : hasFee && going ? (
        <PayStatus guest={g} slug={slug} onUpdate={onUpdate} />
      ) : (
        <span className="text-xs text-[var(--muted)]">{g.rsvp === "not_going" ? "—" : ""}</span>
      )}
    </li>
  );
}

function PayStatus({
  guest,
  slug,
  onUpdate,
}: {
  guest: Guest;
  slug: string;
  onUpdate: (payload: EventPayload) => void;
}) {
  if (guest.validated_at) {
    return (
      <button
        type="button"
        onClick={() => void validatePayment(slug, guest.id, false).then(onUpdate)}
        className="shrink-0 rounded-full bg-[var(--ok)] px-3 py-1.5 text-sm font-semibold text-[#06210f]"
      >
        Pagó
      </button>
    );
  }
  if (guest.marked_at) {
    return (
      <button
        type="button"
        onClick={() => void validatePayment(slug, guest.id, true).then(onUpdate)}
        className="btn-primary shrink-0 px-3 py-1.5 text-sm"
      >
        Validar
      </button>
    );
  }
  return <span className="shrink-0 text-xs text-[var(--muted)]">Aún no transfiere</span>;
}

function RsvpPill({ rsvp }: { rsvp: RSVP }) {
  const tone =
    rsvp === "going"
      ? "bg-[var(--ok)]/20 text-[var(--ok)]"
      : rsvp === "late"
        ? "bg-[var(--gold)]/20 text-[var(--gold)]"
        : rsvp === "not_going"
          ? "bg-[#2a2420] text-[var(--muted)]"
          : "border border-[var(--line)] text-[var(--muted)]";
  return <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{RSVP_LABEL[rsvp]}</p>;
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "border-[var(--gold)] bg-[var(--gold)]/12" : ""}`}>
      <p className={`text-xs uppercase tracking-[0.16em] ${highlight ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{label}</p>
      <p className={`font-display mt-1 text-2xl ${highlight ? "text-[var(--gold)]" : ""}`}>{value}</p>
    </div>
  );
}

function sortGuests(guests: Guest[]) {
  const rank = (g: Guest) => {
    if (!g.is_host && g.marked_at && !g.validated_at) return 0;
    if (g.is_host) return 1;
    if (g.rsvp === "going") return 2;
    if (g.rsvp === "late") return 3;
    if (g.rsvp === "pending") return 4;
    return 5;
  };
  return guests.slice().sort((a, b) => rank(a) - rank(b) || a.display_name.localeCompare(b.display_name, "es"));
}
