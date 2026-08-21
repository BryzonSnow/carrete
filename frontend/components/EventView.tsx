"use client";

import { NameGate } from "@/components/NameGate";
import { QuotaCard } from "@/components/QuotaCard";
import { RsvpCard } from "@/components/RsvpCard";
import { SupplyBoard } from "@/components/SupplyBoard";
import { WhenWhereCard } from "@/components/WhenWhereCard";
import { HostModeBar } from "@/components/HostModeBar";
import { Chevron } from "@/components/Fold";
import { PixelAvatar, PixelIcon } from "@/components/PixelArt";
import { useEvent } from "@/lib/useEvent";
import Link from "next/link";
import { useState } from "react";

export function EventView({ slug }: { slug: string }) {
  const { data, error, loading, setData } = useEvent(slug);
  const [goingOpen, setGoingOpen] = useState(false);

  if (loading) {
    return <p className="pt-24 text-center text-[var(--muted)]">Cargando el carrete…</p>;
  }
  if (error || !data) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-6 text-center">
        <h1 className="font-display text-3xl">No está este carrete</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Armar uno
        </Link>
      </div>
    );
  }

  const { event, me, guests, items, stats, is_admin } = data;
  const going = guests.filter((g) => g.rsvp === "going" || g.rsvp === "late");

  return (
    <>
      {!me ? <NameGate slug={slug} hostName={event.host_name} onJoined={setData} /> : null}
      {is_admin ? <HostModeBar slug={slug} surface="event" /> : null}

      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ember)]">
          {is_admin ? "Tu carrete" : event.host_name ? `Te invita ${event.host_name}` : "Carrete"}
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">{event.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]">
            {stats.going + stats.late} van
            {stats.not_going > 0 ? ` · ${stats.not_going} no pueden` : ""}
          </span>
          <ShareLink name={event.name} />
        </div>
      </header>

      <WhenWhereCard startsAt={event.starts_at} address={event.address} addressLocked={event.address_locked} />

      {me ? (
        <div className="mt-4">
          <RsvpCard slug={slug} current={me.rsvp} onUpdate={setData} />
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <section className="card p-4 sm:p-5">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 text-left"
            onClick={() => setGoingOpen((v) => !v)}
            aria-expanded={goingOpen}
          >
            <span>
              <span className="font-display flex items-center gap-2 text-xl">
                <PixelIcon kind="people" size={24} />
                Quiénes van
              </span>
              {!goingOpen ? (
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {going.length === 0 ? "Todavía nadie confirma" : `${going.length} ${going.length === 1 ? "persona" : "personas"}`}
                </span>
              ) : null}
            </span>
            <Chevron open={goingOpen} />
          </button>
          {goingOpen ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {going.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">Todavía nadie confirma.</li>
              ) : (
                going.map((g) => (
                  <li
                    key={g.id}
                    className={`flex items-center gap-2 rounded-full border px-2 py-1 pr-3 text-sm ${
                      me?.id === g.id ? "border-[var(--ember)]/50 bg-[var(--ember)]/10" : "border-[var(--line)]"
                    }`}
                  >
                    <PixelAvatar seed={g.display_name} size={24} />
                    {g.display_name}
                    {me?.id === g.id ? <span className="text-[var(--muted)]">· tú</span> : null}
                    {g.rsvp === "late" ? <span className="text-[var(--muted)]">· tarde</span> : null}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </section>
        <SupplyBoard
          slug={slug}
          items={items}
          meId={me?.id}
          canAdd={Boolean(me)}
          isAdmin={is_admin}
          onUpdate={setData}
        />
        <QuotaCard slug={slug} data={data} onUpdate={setData} />
      </div>
    </>
  );
}

function ShareLink({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* cancelled or unsupported payload */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={() => void share()}>
      {copied ? "Link copiado" : "Compartir"}
    </button>
  );
}
