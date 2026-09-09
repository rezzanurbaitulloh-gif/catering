import { NextResponse } from "next/server";
import { BUSINESS_ID } from "@/lib/constants";
import { createPrivilegedClient } from "@/lib/server-db";

// Selalu dinamis: mode harus memantul seketika saat diubah dari web mana pun.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/capabilities — daftar capability aktif untuk gating UI premium.
export async function GET() {
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    // Jujur: tanpa service key, anggap hanya Basic agar tidak menampilkan fitur mati.
    return NextResponse.json({ capabilities: ["basic_orders"], limited: true });
  }
  const { data, error } = await client
    .from("business_capabilities")
    .select("capability,enabled")
    .eq("business_id", BUSINESS_ID);
  if (error) return NextResponse.json({ error: "Gagal memuat kapabilitas." }, { status: 500 });
  const list = ((data ?? []) as Array<{ capability: string; enabled: boolean }>)
    .filter((r) => r.enabled)
    .map((r) => r.capability);
  return NextResponse.json({ capabilities: list, limited: false });
}
