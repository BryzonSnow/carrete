"use client";

import Link from "next/link";

export function HostModeBar({
  slug,
  surface,
}: {
  slug: string;
  surface: "event" | "panel";
}) {
  const onPanel = surface === "panel";

  return (
    <div className="host-bar sticky top-0 z-30 -mx-4 mb-5 px-4 py-3 sm:-mx-0 sm:rounded-2xl sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Modo anfitrión</p>
          <p className="truncate text-sm font-medium">
            {onPanel ? "Solo tú ves este panel." : "Estás viendo el carrete como anfitrión."}
          </p>
        </div>
        {onPanel ? (
          <Link href={`/e/${slug}`} className="host-bar-btn shrink-0">
            Ver el carrete
          </Link>
        ) : (
          <Link href={`/e/${slug}/admin`} className="host-bar-btn shrink-0">
            Ir al panel
          </Link>
        )}
      </div>
    </div>
  );
}
