"use client";

import { setRsvp } from "@/lib/api";
import type { EventPayload, RSVP } from "@/lib/types";

const OPTIONS: { value: RSVP; label: string; hint: string }[] = [
  { value: "going", label: "Voy", hint: "Ahí nos vemos" },
  { value: "late", label: "Más tarde", hint: "No me esperen" },
  { value: "not_going", label: "No voy", hint: "La próxima" },
];

export function RsvpCard({
  slug,
  current,
  onUpdate,
}: {
  slug: string;
  current: RSVP;
  onUpdate: (payload: EventPayload) => void;
}) {
  async function pick(rsvp: RSVP) {
    try {
      onUpdate(await setRsvp(slug, rsvp));
    } catch {
      /* keep previous */
    }
  }

  return (
    <section className="card p-4 sm:p-5">
      <h3 className="font-display text-xl">¿Vai?</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {current === "pending" ? "Elige una para que el resto sepa." : "Puedes cambiarla cuando quieras."}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => void pick(opt.value)}
              className={`min-h-16 cursor-pointer rounded-2xl border px-1.5 py-3 text-center transition sm:min-h-[4.5rem] sm:px-3 ${
                active
                  ? opt.value === "going"
                    ? "border-transparent bg-[var(--ok)] text-[#06210f]"
                    : opt.value === "late"
                      ? "border-transparent bg-[var(--gold)] text-[#1a0c04]"
                      : "border-[var(--line)] bg-[#2a2420] text-[var(--cream)]"
                  : "border-[var(--line)] bg-[var(--bg)]/40 hover:border-[var(--ember)]/50"
              }`}
            >
              <span className="block text-sm font-semibold sm:text-base">{opt.label}</span>
              <span
                className={`mt-0.5 block text-[10px] leading-tight sm:text-xs ${
                  active && opt.value !== "not_going" ? "opacity-70" : "text-[var(--muted)]"
                }`}
              >
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
