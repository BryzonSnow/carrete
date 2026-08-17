"use client";

import { CopyButton } from "@/components/CopyButton";
import { PixelIcon } from "@/components/PixelArt";
import { markTransfer } from "@/lib/api";
import { clp, transferText } from "@/lib/format";
import type { EventPayload } from "@/lib/types";

export function QuotaCard({
  slug,
  data,
  onUpdate,
}: {
  slug: string;
  data: EventPayload;
  onUpdate: (payload: EventPayload) => void;
}) {
  const { event, stats, me } = data;
  if (event.fee_amount <= 0) return null;

  const confirmed = me?.rsvp === "going" || me?.rsvp === "late";
  const markedCount = event.fee_amount > 0 ? Math.round(stats.fee_marked / event.fee_amount) : 0;
  const goal = stats.payers || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((markedCount / goal) * 100)) : 0;
  const text = event.bank
    ? transferText(event.bank, event.fee_amount, `${event.name}${me ? ` — ${me.display_name}` : ""}`)
    : "";

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <PixelIcon kind="coin" size={28} />
          <div>
            <h3 className="font-display text-xl">Cuota</h3>
            <p className="text-sm text-[var(--muted)]">Cada uno transfiere lo mismo.</p>
          </div>
        </div>
        <p className="font-display text-2xl leading-none">{clp(event.fee_amount)}</p>
      </div>

      {!confirmed ? (
        <p className="mt-4 rounded-xl bg-[#2a2420] px-3 py-3 text-sm text-[var(--muted)]">
          Confirma que vai para ver los datos de transferencia.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {event.bank ? (
            <>
              <dl className="grid gap-2 rounded-xl bg-[#2a2420] px-3 py-3 text-sm">
                <BankRow label="Titular" value={event.bank.holder} />
                <BankRow label="RUT" value={event.bank.rut} />
                <BankRow label="Banco" value={`${event.bank.bank_name} · ${event.bank.account_type}`} />
                <BankRow label="Cuenta" value={event.bank.account_number} mono />
                <BankRow label="Monto" value={clp(event.fee_amount)} />
              </dl>
              <CopyButton
                text={text}
                label="Copiar datos de transferencia"
                copiedLabel="Datos copiados"
                className="btn-primary w-full"
              />
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">El anfitrión no cargó datos bancarios.</p>
          )}
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${
              me?.validated_at
                ? "border-[var(--ok)] bg-[var(--ok)]/10"
                : me?.marked_at
                  ? "border-[var(--gold)]/60 bg-[var(--gold)]/10"
                  : "border-[var(--line)]"
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(me?.marked_at)}
              disabled={Boolean(me?.validated_at)}
              onChange={(e) => void markTransfer(slug, e.target.checked).then(onUpdate)}
            />
            <span>
              Ya transferí
              {me?.validated_at ? (
                <span className="ml-2 text-xs text-[var(--ok)]">Validado por el anfitrión</span>
              ) : me?.marked_at ? (
                <span className="ml-2 text-xs text-[var(--gold)]">El anfitrión lo va a revisar</span>
              ) : null}
            </span>
          </label>
        </div>
      )}

      {stats.payers > 0 ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#2a2420]">
            <div className="h-full rounded-full bg-[var(--ok)] transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {markedCount === 0
              ? "Nadie ha marcado transferencia todavía."
              : `${markedCount} de ${stats.payers} ya marcaron que transfirieron.`}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</dt>
      <dd className={`text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
