"use client";

import { useMemo, useState } from "react";
import { addItem, claimItem, deleteItem } from "@/lib/api";
import type { EventPayload, Item } from "@/lib/types";
import { ItemPixelIcon, PixelAvatar } from "@/components/PixelArt";

export function SupplyBoard({
  slug,
  items,
  meId,
  canAdd,
  isAdmin,
  onUpdate,
}: {
  slug: string;
  items: Item[];
  meId?: string;
  canAdd: boolean;
  isAdmin: boolean;
  onUpdate: (payload: EventPayload) => void;
}) {
  const [openExtra, setOpenExtra] = useState(false);
  const [openNeeded, setOpenNeeded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const needed = useMemo(() => items.filter((item) => !item.is_open), [items]);
  const extras = useMemo(() => items.filter((item) => item.is_open), [items]);
  const extraGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Item[]>();
    for (const item of extras) {
      const who = item.claims[0]?.guest_name || "Alguien";
      if (!map.has(who)) {
        map.set(who, []);
        order.push(who);
      }
      map.get(who)!.push(item);
    }
    return order.map((who) => ({ who, items: map.get(who)! }));
  }, [extras]);

  async function toggleClaim(item: Item) {
    if (!meId || busyId) return;
    const mine = item.claims.find((c) => c.guest_id === meId);
    const remaining = Math.max(0, item.required_qty - item.committed_qty);
    if (!mine && remaining <= 0) return;
    setBusyId(item.id);
    try {
      onUpdate(await claimItem(slug, item.id, mine ? 0 : 1));
    } catch {
      /* keep previous */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {needed.length > 0 || isAdmin ? (
        <section className="card p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-xl">Qué hay que llevar</h3>
              <p className="text-sm text-[var(--muted)]">
                {needed.length > 0
                  ? "Elige algo y di: ok, yo voy con esto."
                  : "Suma lo que hace falta. Los invitados eligen y dicen ok, yo voy con esto."}
              </p>
            </div>
            {isAdmin ? (
              <button type="button" className="btn-ghost text-sm" onClick={() => setOpenNeeded(true)}>
                + A la lista
              </button>
            ) : null}
          </div>

        {needed.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {needed.map((item) => {
              const mine = Boolean(meId && item.claims.some((c) => c.guest_id === meId));
              const remaining = Math.max(0, item.required_qty - item.committed_qty);
              const covered = remaining <= 0;
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    mine
                      ? "border-[var(--ok)]/50 bg-[var(--ok)]/10"
                      : covered
                        ? "border-[var(--line)] bg-[var(--bg)]/30"
                        : "border-[var(--line)] bg-[var(--bg)]/50"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex min-w-0 items-center gap-3">
                      <ItemPixelIcon name={item.name} size={28} />
                      <span>
                        <span className="font-medium">{item.name}</span>
                        {item.required_qty > 1 ? (
                          <span className="text-sm text-[var(--muted)]">
                            {" "}
                            · {item.committed_qty}/{item.required_qty}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {canAdd ? (
                      <ClaimButton
                        mine={mine}
                        covered={covered}
                        busy={busyId === item.id}
                        onClick={() => void toggleClaim(item)}
                      />
                    ) : null}
                  </div>
                  {item.claims.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {item.claims.map((claim) => (
                        <li
                          key={claim.guest_id}
                          className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2 py-0.5 text-xs"
                        >
                          <PixelAvatar seed={claim.guest_name} size={16} />
                          {claim.guest_name}
                          {meId === claim.guest_id ? <span className="text-[var(--muted)]">· tú</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--muted)]">Todavía nadie lo toma.</p>
                  )}
                  {isAdmin ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--cream)]"
                      onClick={() => void deleteItem(slug, item.id).then(onUpdate)}
                    >
                      Quitar de la lista
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        </section>
      ) : null}

      <section className="card p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">También llevan</h3>
            <p className="text-sm text-[var(--muted)]">Opcional. Cada uno anota lo suyo.</p>
          </div>
          {canAdd ? (
            <button type="button" className="btn-ghost text-sm" onClick={() => setOpenExtra(true)}>
              + Yo llevo
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {extraGroups.map((group) => (
            <div key={group.who}>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                <PixelAvatar seed={group.who} size={18} />
                {group.who}
              </p>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => {
                  const mine = Boolean(
                    meId && (item.created_by_guest_id === meId || item.claims.some((c) => c.guest_id === meId)),
                  );
                  const note = item.unit && item.unit !== "un" ? item.unit : "";
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 px-3 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ItemPixelIcon name={item.name} size={28} />
                        <span>
                          <span className="font-medium">{item.name}</span>
                          {note ? <span className="text-sm text-[var(--muted)]"> · {note}</span> : null}
                        </span>
                      </span>
                      {mine ? (
                        <button
                          type="button"
                          className="text-xs text-[var(--muted)] hover:text-[var(--cream)]"
                          onClick={() => void deleteItem(slug, item.id).then(onUpdate)}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {extras.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Todavía vacío. Si vai a llevar algo extra, anótalo.</p>
          ) : null}
        </div>
      </section>

      {openExtra ? (
        <AddBringModal
          slug={slug}
          title="Yo llevo"
          hint="Lo que se te ocurra. Queda con tu nombre."
          submitLabel="Anotar"
          isOpen
          onClose={() => setOpenExtra(false)}
          onUpdate={(payload) => {
            onUpdate(payload);
            setOpenExtra(false);
          }}
        />
      ) : null}
      {openNeeded ? (
        <AddBringModal
          slug={slug}
          title="Sumar a la lista"
          hint="Queda para que alguien lo reclame."
          submitLabel="Sumar"
          isOpen={false}
          onClose={() => setOpenNeeded(false)}
          onUpdate={(payload) => {
            onUpdate(payload);
            setOpenNeeded(false);
          }}
        />
      ) : null}
    </>
  );
}

function ClaimButton({
  mine,
  covered,
  busy,
  onClick,
}: {
  mine: boolean;
  covered: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  if (mine) {
    return (
      <button type="button" className="btn-ghost w-full shrink-0 px-3 py-1.5 text-sm sm:w-auto" disabled={busy} onClick={onClick}>
        {busy ? "…" : "Lo dejo"}
      </button>
    );
  }
  if (covered) {
    return <span className="shrink-0 text-xs text-[var(--ok)]">Cubierto</span>;
  }
  return (
    <button type="button" className="btn-primary w-full shrink-0 px-3 py-1.5 text-sm sm:w-auto" disabled={busy} onClick={onClick}>
      {busy ? "…" : "Ok, yo voy con esto"}
    </button>
  );
}

function AddBringModal({
  slug,
  title,
  hint,
  submitLabel,
  isOpen,
  onClose,
  onUpdate,
}: {
  slug: string;
  title: string;
  hint: string;
  submitLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (payload: EventPayload) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onUpdate(
        await addItem(slug, {
          category: isOpen ? "Aportes" : "Lista",
          name,
          unit: isOpen ? note.trim() : "un",
          required_qty: 1,
          is_open: isOpen,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70 p-4 sm:place-items-center">
      <form onSubmit={(e) => void submit(e)} className="card w-full max-w-md p-6">
        <h3 className="font-display text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Qué</span>
            <input
              className="field"
              autoFocus
              placeholder="Hielo, ensalada, parlante, carbón…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {isOpen ? (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Detalle (opcional)</span>
              <input className="field" placeholder="2 bolsas, casero, etc." value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" disabled={busy || name.trim().length < 1}>
            {busy ? "Anotando…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
