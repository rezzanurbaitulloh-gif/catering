import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klien ANON untuk sisi server — dipakai untuk bacaan katalog publik
// (packages, website_content, testimonials, galleries: policy public_read)
// dan insert inquiries/complaints (policy inquiries_anon_insert).
// Tidak pernah memakai service_role key.

export function publicEnv(): { url: string; anon: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || anon.includes("paste-")) return null;
  return { url, anon };
}

export function createAnonServerClient(): SupabaseClient | null {
  const env = publicEnv();
  if (!env) return null;
  return createClient(env.url, env.anon, {
    auth: { persistSession: false },
    global: { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } },
  });
}
