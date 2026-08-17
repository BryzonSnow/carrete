"use client";

import { lookupAdmin } from "@/lib/api";
import { setAdminToken } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function MagicAdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    lookupAdmin(token)
      .then((out) => {
        if (cancelled) return;
        setAdminToken(out.slug, out.admin_token);
        router.replace(`/e/${out.slug}/admin`);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Link inválido");
      });
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-6 text-center">
        <h1 className="font-display text-3xl">Link de admin inválido</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
      </div>
    );
  }

  return <p className="pt-24 text-center text-[var(--muted)]">Abriendo tu panel…</p>;
}
