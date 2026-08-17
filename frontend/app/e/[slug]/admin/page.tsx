"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { useEvent } from "@/lib/useEvent";
import { getAdminToken } from "@/lib/storage";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, error, loading, setData } = useEvent(slug);
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    setHasToken(Boolean(getAdminToken(slug)));
  }, [slug]);

  if (loading) {
    return <p className="pt-24 text-center text-[var(--muted)]">Cargando panel…</p>;
  }
  if (!hasToken || !data?.is_admin) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-6 text-center">
        <h1 className="font-display text-3xl">Este panel es del anfitrión</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Abre el link mágico que te dimos al crear el carrete. Se guarda en este navegador.
        </p>
        <Link href={`/e/${slug}`} className="btn-primary mt-4 inline-flex">
          Ir como invitado
        </Link>
      </div>
    );
  }
  if (error || !data) {
    return <p className="pt-24 text-center text-red-400">{error}</p>;
  }
  return <AdminPanel slug={slug} data={data} onUpdate={setData} />;
}
