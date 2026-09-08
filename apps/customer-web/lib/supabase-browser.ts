import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klien browser ANON (tanpa sesi). Dipakai toggle mode publik + realtime.
// Tidak pernah membawa service_role key.
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || anon.includes("paste-")) return null;
  client = createClient(url, anon, { auth: { persistSession: false } });
  return client;
}
