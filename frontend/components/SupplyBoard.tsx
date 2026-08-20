"use client";

import { useMemo, useState } from "react";
import { addItem, claimItem, deleteItem } from "@/lib/api";
import type { EventPayload, Item } from "@/lib/types";
import { Chevron } from "@/components/Fold";
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
  const [neededOpen, setNeededOpen] = useState(() => items.some((item) => !item.is_open));
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [foldedWho, setFoldedWho] = useState<Record<string, boolean>>({});

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
    const mine = item.claims.some((c) => c.guest_id === meId);
    setBusyId(item.id);
    try {
      onUpdate(await claimItem(slug, item.id, mine ? 0 : 1));
    } catch {
      /* keep previous */
    } finally {
      setBusyId(null);
    }
  }

  const claimedCount = needed.filter((item) => item.claims.length > 0).length;

  return (
    <>
      {needed.length > 0 || isAdmin ? (
        <section className="card p-4 sm:p-5">
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
              onClick={() => setNeededOpen((v) => !v)}
              aria-expanded={neededOpen}
            >
              <span>
                <span className="font-display block text-xl">Qué hay que llevar</span>
                <span className="text-sm text-[var(--muted)]">
                  {needed.length === 0
                    ? "Suma lo que hace falta. Pueden ir varios en lo mismo."
                    : neededOpen
                      ? "Elige algo. Si ya hay alguien en vino, tú también puedes."
                      : `${needed.length} cosas${claimedCount ? ` · ${claimedCount} con alguien` : ""}`}
                </span>
              </span>
              <Chevron open={neededOpen} />
            </button>
            {isAdmin ? (
              <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={() => setOpenNeeded(true)}>
                + A la lista
              </button>
            ) : null}
          </div>

          {neededOpen && needed.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {needed.map((item) => {
                const mine = Boolean(meId && item.claims.some((c) => c.guest_id === meId));
                return (
                  <li
                    key={item.id}
                    className={`rounded-2xl border px-3 py-3 ${
                      mine ? "border-[var(--ok)]/50 bg-[var(--ok)]/10" : "border-[var(--line)] bg-[var(--bg)]/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex min-w-0 items-center gap-3">
                        <ItemPixelIcon name={item.name} size={28} />
                        <span className="font-medium">{item.name}</span>
                      </span>
                      {canAdd ? (
                        <ClaimButton mine={mine} busy={busyId === item.id} onClick={() => void toggleClaim(item)} />
                      ) : null}
                    </div>
                    {item.claims.length > 0 ? (
                      <>
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
                        {item.claims.length > 1 ? (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Van {item.claims.length}. Si es una sola cosa, avísense; si cada uno lleva, ya está.
                          </p>
                        ) : null}
                      </>
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
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
            onClick={() => setExtrasOpen((v) => !v)}
            aria-expanded={extrasOpen}
          >
            <span>
              <span className="font-display block text-xl">También llevan</span>
              <span className="text-sm text-[var(--muted)]">
                {extrasOpen
                  ? "Opcional. Anota lo tuyo, con la cantidad si quieres."
                  : extras.length === 0
                    ? "Todavía vacío"
                    : `${extras.length} cosas · ${extraGroups.length} ${extraGroups.length === 1 ? "persona" : "personas"}`}
              </span>
            </span>
            <Chevron open={extrasOpen} />
          </button>
          {canAdd ? (
            <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={() => setOpenExtra(true)}>
              + Yo llevo
            </button>
          ) : null}
        </div>

        {extrasOpen ? (
          <div className="mt-4 space-y-3">
            {extraGroups.map((group) => {
              const open = foldedWho[group.who] !== true;
              return (
                <div key={group.who} className="overflow-hidden rounded-2xl border border-[var(--line)]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                    onClick={() => setFoldedWho((prev) => ({ ...prev, [group.who]: open }))}
                    aria-expanded={open}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
                      <PixelAvatar seed={group.who} size={18} />
                      {group.who}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{group.items.length}</span>
                      <Chevron open={open} />
                    </span>
                  </button>
                  {open ? (
                    <ul className="border-t border-[var(--line)] px-2 py-2">
                      {group.items.map((item) => {
                        const mine = Boolean(
                          meId && (item.created_by_guest_id === meId || item.claims.some((c) => c.guest_id === meId)),
                        );
                        return (
                          <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2">
                            <span className="flex min-w-0 items-center gap-3">
                              <ItemPixelIcon name={item.name} size={28} />
                              <span className="font-medium">{item.name}</span>
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
                  ) : null}
                </div>
              );
            })}
            {extras.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Todavía vacío. Si vai a llevar algo extra, anótalo.</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {openExtra ? (
        <AddBringModal
          slug={slug}
          title="Yo llevo"
          hint="Ej: 2 botellas de agua. Queda con tu nombre."
          placeholder="2 botellas de agua, ensalada, parlante…"
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
          hint="Queda para que alguien lo reclame. Pueden ir varios."
          placeholder="Vino, hielo, ensalada…"
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

function ClaimButton({ mine, busy, onClick }: { mine: boolean; busy: boolean; onClick: () => void }) {
  if (mine) {
    return (
      <button type="button" className="btn-ghost w-full shrink-0 px-3 py-1.5 text-sm sm:w-auto" disabled={busy} onClick={onClick}>
        {busy ? "…" : "Lo dejo"}
      </button>
    );
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
  placeholder,
  submitLabel,
  isOpen,
  onClose,
  onUpdate,
}: {
  slug: string;
  title: string;
  hint: string;
  placeholder: string;
  submitLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (payload: EventPayload) => void;
}) {
  const [name, setName] = useState("");
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
          unit: "",
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
        <label className="mt-4 grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Qué</span>
          <input
            className="field"
            autoFocus
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
