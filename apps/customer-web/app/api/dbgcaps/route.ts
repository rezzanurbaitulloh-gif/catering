import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/server-db";
import { BUSINESS_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Route DEBUG SEMENTARA — akan dihapus. Bandingkan raw fetch vs supabase-js.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const q = `${url}/rest/v1/business_capabilities?select=capability,enabled&business_id=eq.${BUSINESS_ID}&capability=eq.risk_engine`;
  const rawRes = await fetch(q, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
    cache: "no-store",
  });
  const raw = (await rawRes.json().catch(() => null)) as unknown;
  const { client } = createPrivilegedClient();
  let lib: unknown = null;
  if (client) {
    const { data } = await client
      .from("business_capabilities")
      .select("capability,enabled")
      .eq("business_id", BUSINESS_ID)
      .eq("capability", "risk_engine");
    lib = data;
  }
  return NextResponse.json({ raw, lib });
}
