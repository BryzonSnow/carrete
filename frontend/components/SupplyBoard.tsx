"use client";

import { useMemo, useState } from "react";
import { addItem, deleteItem } from "@/lib/api";
import type { EventPayload, Item } from "@/lib/types";
import { ItemPixelIcon, PixelAvatar } from "@/components/PixelArt";

export function SupplyBoard({
  slug,
  items,
  meId,
  canAdd,
  onUpdate,
}: {
  slug: string;
  items: Item[];
  meId?: string;
  canAdd: boolean;
  onUpdate: (payload: EventPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const who = item.claims[0]?.guest_name || "Alguien";
      if (!map.has(who)) {
        map.set(who, []);
        order.push(who);
      }
      map.get(who)!.push(item);
    }
    return order.map((who) => ({ who, items: map.get(who)! }));
  }, [items]);

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">¿Qué llevamos?</h3>
          <p className="text-sm text-[var(--muted)]">Opcional. Cada uno anota lo suyo.</p>
        </div>
        {canAdd ? (
          <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(true)}>
            + Yo llevo
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.who}>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              <PixelAvatar seed={group.who} size={18} />
              {group.who}
            </p>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => {
                const mine = Boolean(meId && (item.created_by_guest_id === meId || item.claims.some((c) => c.guest_id === meId)));
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
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Todavía vacío. Si vai a llevar algo, anótalo.</p>
        ) : null}
      </div>

      {open ? (
        <AddBringModal
          slug={slug}
          onClose={() => setOpen(false)}
          onUpdate={(payload) => {
            onUpdate(payload);
            setOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function AddBringModal({
  slug,
  onClose,
  onUpdate,
}: {
  slug: string;
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
          category: "Aportes",
          name,
          unit: note.trim(),
          required_qty: 1,
          is_open: true,
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
        <h3 className="font-display text-2xl">Yo llevo</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Lo que se te ocurra. Queda con tu nombre.</p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Qué llevas</span>
            <input
              className="field"
              autoFocus
              placeholder="Hielo, ensalada, parlante, carbón…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Detalle (opcional)</span>
            <input className="field" placeholder="2 bolsas, casero, etc." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" disabled={busy || name.trim().length < 1}>
            {busy ? "Anotando…" : "Anotar"}
          </button>
        </div>
      </form>
    </div>
  );
}
