"use client";

import { useState } from "react";
import { joinEvent } from "@/lib/api";
import type { EventPayload } from "@/lib/types";
import { PixelAvatar } from "@/components/PixelArt";

export function NameGate({
  slug,
  hostName,
  onJoined,
}: {
  slug: string;
  hostName: string;
  onJoined: (payload: EventPayload) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = await joinEvent(slug, name);
      onJoined(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70 p-4 sm:place-items-center">
      <form onSubmit={(e) => void submit(e)} className="card w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <PixelAvatar seed={name.trim() || hostName || "?"} size={48} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ember)]">Invitación</p>
            <h2 className="font-display mt-2 text-3xl">¿Cómo te llamai?</h2>
          </div>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {hostName ? `Te invita ${hostName}. ` : ""}
          Sin cuenta: lo dejamos en este navegador para no pedirte el nombre de nuevo.
        </p>
        <label className="mt-5 grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Nombre o apodo</span>
          <input
            autoFocus
            className="field"
            placeholder="Nico, Cami, El Jefe…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCapitalize="words"
            autoComplete="name"
            enterKeyHint="done"
            required
            maxLength={40}
          />
        </label>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <button className="btn-primary mt-4 w-full" disabled={busy || name.trim().length < 2}>
          {busy ? "Entrando…" : "Entrar al carrete"}
        </button>
      </form>
    </div>
  );
}
