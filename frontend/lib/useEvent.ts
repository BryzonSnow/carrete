"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchEvent } from "./api";
import { subscribeLive } from "./supabase";
import type { EventPayload } from "./types";

export function useEvent(slug: string) {
  const [data, setData] = useState<EventPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const payload = await fetchEvent(slug);
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!data?.event.id) return;
    return subscribeLive(data.event.id, () => {
      void reload();
    });
  }, [data?.event.id, reload]);

  return { data, error, loading, setData, reload };
}
