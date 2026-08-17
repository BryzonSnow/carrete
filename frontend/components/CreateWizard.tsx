"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, joinEvent } from "@/lib/api";
import { ACCOUNT_TYPES, BANKS } from "@/lib/defaults";
import { defaultStartsAt, parseLocalInput } from "@/lib/format";
import { setAdminToken } from "@/lib/storage";
import { PixelAvatar } from "@/components/PixelArt";

const STEPS = ["El carrete", "Cuota", "Listo"];

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [hostName, setHostName] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStartsAt);
  const [useFee, setUseFee] = useState(false);
  const [fee, setFee] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankRut, setBankRut] = useState("");
  const [bankName, setBankName] = useState("BancoEstado");
  const [accountType, setAccountType] = useState("Cuenta Vista");
  const [accountNumber, setAccountNumber] = useState("");
  const [created, setCreated] = useState<{ slug: string; admin_token: string } | null>(null);

  const feeAmount = useFee ? Number(fee.replace(/\D/g, "")) || 0 : 0;
  const guestUrl = useMemo(() => {
    if (!created || typeof window === "undefined") return "";
    return `${window.location.origin}/e/${created.slug}`;
  }, [created]);
  const adminUrl = useMemo(() => {
    if (!created || typeof window === "undefined") return "";
    return `${window.location.origin}/a/${created.admin_token}`;
  }, [created]);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const out = await createEvent({
        name,
        host_name: hostName,
        starts_at: parseLocalInput(startsAt).toISOString(),
        address: "",
        fee_amount: feeAmount,
        bank_holder: useFee ? bankHolder : "",
        bank_rut: useFee ? bankRut : "",
        bank_name: useFee ? bankName : "",
        bank_account_type: useFee ? accountType : "",
        bank_account_number: useFee ? accountNumber : "",
        items: [],
      });
      setAdminToken(out.slug, out.admin_token);
      if (hostName.trim()) {
        await joinEvent(out.slug, hostName, "going");
      }
      setCreated(out);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5 sm:p-7">
      <ol className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${
                i === step
                  ? "bg-[var(--ember)] text-[#1a0c04]"
                  : i < step
                    ? "bg-[var(--ok)] text-[#06210f]"
                    : "border border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? "text-[var(--cream)]" : "text-[var(--muted)]"}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-4">
          <div>
            <h2 className="font-display text-3xl">¿Qué vamos a armar?</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Lo demás (cuota, qué lleva cada uno) es opcional y se arma en el link.
            </p>
          </div>
          <Field label="Nombre del carrete">
            <input
              className="field"
              placeholder="Asado sábado, once, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="sentences"
              enterKeyHint="next"
            />
          </Field>
          <Field label="Tu nombre">
            <div className="flex items-center gap-2">
              <PixelAvatar seed={hostName.trim() || "?"} size={40} />
              <input
                className="field"
                placeholder="Cómo te conocen"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={40}
              />
            </div>
          </Field>
          <p className="-mt-2 text-xs text-[var(--muted)]">Quedas en la lista como que vai. Lo puedes cambiar después.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input
                className="field"
                type="date"
                value={startsAt.slice(0, 10)}
                onChange={(e) => {
                  const time = (startsAt.split("T")[1] || "20:00").slice(0, 5);
                  setStartsAt(`${e.target.value || startsAt.slice(0, 10)}T${time}`);
                }}
              />
            </Field>
            <Field label="Hora">
              <input
                className="field"
                type="time"
                value={(startsAt.split("T")[1] || "20:00").slice(0, 5)}
                onChange={(e) => {
                  const date = startsAt.slice(0, 10);
                  const time = (e.target.value || "20:00").slice(0, 5);
                  setStartsAt(`${date}T${time}`);
                }}
              />
            </Field>
          </div>
          <button
            type="button"
            className="btn-primary mt-1 min-h-12"
            disabled={name.trim().length < 2 || hostName.trim().length < 2}
            onClick={() => setStep(1)}
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <div>
            <h2 className="font-display text-3xl">¿Hay cuota?</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Opcional. Si cada uno lleva lo suyo, sáltala.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={!useFee ? "btn-primary" : "btn-ghost"} onClick={() => setUseFee(false)}>
              No
            </button>
            <button type="button" className={useFee ? "btn-primary" : "btn-ghost"} onClick={() => setUseFee(true)}>
              Sí, hay cuota
            </button>
          </div>
          {useFee ? (
            <>
              <Field label="Cuota por persona">
                <input
                  className="field"
                  inputMode="numeric"
                  placeholder="5000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </Field>
              <Field label="Titular de la cuenta">
                <input className="field" placeholder="Nombre del titular" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
              </Field>
              <Field label="RUT">
                <input className="field" placeholder="12.345.678-9" value={bankRut} onChange={(e) => setBankRut(e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Banco">
                  <select className="field" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo de cuenta">
                  <select className="field" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Número de cuenta">
                <input
                  className="field"
                  placeholder="Solo números"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={() => setStep(0)}>
              Atrás
            </button>
            <button type="button" className="btn-primary flex-1" disabled={busy} onClick={() => void finish()}>
              {busy ? "Creando…" : "Crear carrete"}
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 && created ? (
        <div className="grid gap-4">
          <div>
            <h2 className="font-display text-3xl">Listo. Mándales el link.</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ya quedaste como que vai. Mándales el link; el de admin queda en este navegador.
            </p>
          </div>
          <LinkRow label="Invitados" value={guestUrl} />
          <LinkRow label="Admin (no lo pierdas)" value={adminUrl} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-primary flex-1" onClick={() => router.push(`/e/${created.slug}`)}>
              Ver como invitado
            </button>
            <button className="btn-ghost flex-1" onClick={() => router.push(`/e/${created.slug}/admin`)}>
              Panel de control
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function LinkRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold)]">{label}</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <input className="field" readOnly value={value} />
        <button
          type="button"
          className="btn-ghost sm:shrink-0"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Ok" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
