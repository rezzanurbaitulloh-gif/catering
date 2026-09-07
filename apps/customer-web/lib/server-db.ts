import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAnonServerClient, publicEnv } from "./supabase-server";

// Akses data PRIVAT sisi server (events, payments, quotes, capabilities…).
//
// Konteks: policy RLS saat ini HANYA di 0001_init.sql memberi anon:
//   - select katalog publik (packages, menu_items, galleries, testimonials, website_content)
//   - insert inquiries & complaints.
// Bacaan event/quote/payment milik pelanggan butuh hak lebih.
//
// Lapisan ini memakai SUPABASE_SERVICE_ROLE_KEY (env khusus server, tanpa prefix
// NEXT_PUBLIC_, tidak pernah dikirim ke browser) BILA tersedia, dan SELALU
// menegakkan pencocokan nomor HP di kode (never expose other customers' data).
// Bila key belum dikonfigurasi, route menjawab 503 yang jujur — tanpa data palsu.

export type DbMode = "service" | "anon" | "none";

export function createPrivilegedClient(): { client: SupabaseClient | null; mode: DbMode } {
  const env = publicEnv();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (env && service && !service.includes("paste-")) {
    return {
      client: createClient(env.url, service, { auth: { persistSession: false } }),
      mode: "service",
    };
  }
  const anon = createAnonServerClient();
  return { client: anon, mode: anon ? "anon" : "none" };
}

export const SERVICE_UNAVAILABLE = {
  error:
    "Pelacakan daring belum aktif di server. Hubungi kami via WhatsApp sambil menunggu konfigurasi server dilengkapi.",
  code: "SERVICE_NOT_CONFIGURED",
} as const;
