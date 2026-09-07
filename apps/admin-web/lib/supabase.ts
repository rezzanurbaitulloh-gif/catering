import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Singleton browser client. Auth tersimpan di localStorage oleh supabase-js.
// Semua query memakai RLS; tidak ada service_role di app ini.
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  client = createClient(url, anon);
  return client;
}

// Business demo dari supabase/seed/demo.sql — dipakai saat mode demo (tanpa sesi)
// dan sebagai fallback bila profil belum punya business.
export const DEMO_BUSINESS_ID = '11111111-1111-1111-1111-111111111111';

export function isMissingEnv(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
