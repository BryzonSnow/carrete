"use client";

import { CreateWizard } from "@/components/CreateWizard";
import { PixelAvatar, PixelIcon } from "@/components/PixelArt";

const PREVIEW = ["Nico", "Cami", "Mati", "Javi", "Fran", "Pato"];

export default function HomePage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10">
      <div className="order-2 lg:order-1 lg:pt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--ember)]">Beta 0.1</p>
        <h1 className="font-display mt-3 text-4xl leading-none sm:text-5xl lg:text-6xl">
          El carrete,
          <br />
          organizado.
        </h1>
        <p className="mt-4 max-w-md text-base text-[var(--muted)] sm:text-lg">
          Un link. El invitado pone su apodo y si vai. Sin app, sin cuenta.
        </p>
        <div className="mt-5 flex items-center">
          {PREVIEW.map((name, i) => (
            <span key={name} className="relative" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: PREVIEW.length - i }}>
              <PixelAvatar seed={name} size={36} className="ring-2 ring-[var(--bg)]" />
            </span>
          ))}
        </div>
        <ul className="mt-8 hidden space-y-4 text-sm text-[var(--cream)]/85 lg:block">
          <li className="flex gap-3">
            <PixelIcon kind="people" size={28} />
            <span>
              <span className="block font-medium text-[var(--cream)]">Quién vai</span>
              Voy, no voy, o llego más tarde.
            </span>
          </li>
          <li className="flex gap-3">
            <PixelIcon kind="bag" size={28} />
            <span>
              <span className="block font-medium text-[var(--cream)]">Qué lleva cada uno</span>
              Opcional. No es lista de compras: cada uno anota lo suyo.
            </span>
          </li>
          <li className="flex gap-3">
            <PixelIcon kind="coin" size={28} />
            <span>
              <span className="block font-medium text-[var(--cream)]">Cuota, si hay</span>
              Datos de transferencia para copiar. Cada uno transfiere lo mismo.
            </span>
          </li>
        </ul>
      </div>
      <div className="order-1 lg:order-2">
        <CreateWizard />
      </div>
    </div>
  );
}
