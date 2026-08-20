"use client";

import { validatePayment } from "@/lib/api";
import { formatWhen, origin } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import { ItemPixelIcon, PixelAvatar } from "@/components/PixelArt";
import type { EventPayload } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const RSVP_LABEL: Record<string, string> = {
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

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ember)]">Panel de control</p>
        <h1 className="font-display mt-1 text-4xl">{event.name}</h1>
        <p className="mt-1 text-[var(--muted)]">{formatWhen(event.starts_at)}</p>
        {event.address ? <p className="mt-2 text-sm">{event.address}</p> : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <CopyButton text={guestUrl} label="Copiar link de invitados" className="btn-primary" />
          {adminUrl ? (
            <CopyButton text={adminUrl} label="Copiar link mágico admin" className="btn-ghost" />
          ) : null}
        </div>
        <Link href={`/e/${slug}`} className="mt-3 inline-block text-sm text-[var(--gold)]">
          Ver como invitado →
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Van" value={stats.going + stats.late} />
        <Stat label="No van" value={stats.not_going} />
        {event.fee_amount > 0 ? (
          <>
            <Stat
              label="Validados"
              value={guests.filter((g) => (g.rsvp === "going" || g.rsvp === "late") && g.validated_at).length}
            />
            <Stat
              label="Por revisar"
              value={guests.filter((g) => (g.rsvp === "going" || g.rsvp === "late") && g.marked_at && !g.validated_at).length}
            />
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
        </div>
        <ul>
          {guests.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">Todavía nadie entra al link.</li>
          ) : (
            guests.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0">
                <div className="flex min-w-0 items-center gap-3">
                  <PixelAvatar seed={g.display_name} size={32} />
                  <div>
                    <p className="font-medium">{g.display_name}</p>
                    <p className="text-xs text-[var(--muted)]">{RSVP_LABEL[g.rsvp]}</p>
                  </div>
                </div>
                {event.fee_amount > 0 && (g.rsvp === "going" || g.rsvp === "late") ? (
                  <button
                    type="button"
                    onClick={() => void validatePayment(slug, g.id, !g.validated_at).then(onUpdate)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition ${
                      g.validated_at
                        ? "bg-[var(--ok)] text-[#06210f]"
                        : g.marked_at
                          ? "bg-[var(--gold)] text-[#1a0c04]"
                          : "border border-[var(--line)] text-[var(--muted)] hover:border-[var(--cream)]/40"
                    }`}
                  >
                    {g.validated_at ? "Validado" : g.marked_at ? "Transferido · validar" : "Sin pago"}
                  </button>
                ) : (
                  <span className="text-xs text-[var(--muted)]">{g.rsvp === "not_going" ? "—" : ""}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-2xl">Qué hay que llevar</h2>
        </div>
        <ul>
          {data.items.filter((item) => !item.is_open).length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">No armaste lista. Los invitados igual pueden anotar extras.</li>
          ) : (
            data.items
              .filter((item) => !item.is_open)
              .map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0">
                  <p className="flex min-w-0 items-center gap-3 font-medium">
                    <ItemPixelIcon name={item.name} size={24} />
                    <span>{item.name}</span>
                  </p>
                  <span className="text-right text-sm text-[var(--muted)]">
                    {item.claims.length === 0
                      ? "Nadie aún"
                      : item.claims.map((c) => c.guest_name).join(", ")}
                  </span>
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-2xl">Extras</h2>
        </div>
        <ul>
          {data.items.filter((item) => item.is_open).length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">Nadie anotó algo extra todavía.</li>
          ) : (
            data.items
              .filter((item) => item.is_open)
              .map((item) => (
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="font-display mt-1 text-2xl">{value}</p>
    </div>
  );
}
