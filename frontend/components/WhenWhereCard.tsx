"use client";

import { PixelIcon } from "@/components/PixelArt";
import { formatWhenParts, mapsUrl } from "@/lib/format";

export function WhenWhereCard({
  startsAt,
  address,
  addressLocked,
}: {
  startsAt: string;
  address: string | null;
  addressLocked: boolean;
}) {
  const when = formatWhenParts(startsAt);
  const showPlace = Boolean(address) || addressLocked;

  return (
    <section className={`grid gap-3 ${showPlace ? "sm:grid-cols-2" : ""}`}>
      <div className="card flex gap-3 p-4 sm:p-5">
        <PixelIcon kind="clock" size={28} />
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Cuándo</p>
          <p className="mt-1 capitalize">{when.date}</p>
          <p className="font-display text-2xl leading-none">{when.time}</p>
        </div>
      </div>
      {showPlace ? (
        <div className="card flex gap-3 p-4 sm:p-5">
          <PixelIcon kind="pin" size={28} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Dónde</p>
            {address ? (
              <>
                <p className="mt-1 break-words">{address}</p>
                <a
                  href={mapsUrl(address)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-[var(--gold)]"
                >
                  Ver mapa
                </a>
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--muted)]">Confirma que vai para ver el lugar.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
