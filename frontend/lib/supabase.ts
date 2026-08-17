import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function subscribeLive(eventId: string, onBump: () => void): () => void {
  const sb = supabase();
  if (!sb) {
    const id = window.setInterval(onBump, 2000);
    return () => window.clearInterval(id);
  }
  const channel: RealtimeChannel = sb
    .channel(`carrete:${eventId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "live_signals", filter: `event_id=eq.${eventId}` },
      onBump,
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}
