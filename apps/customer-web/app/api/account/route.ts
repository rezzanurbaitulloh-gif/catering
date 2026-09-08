import { NextResponse } from "next/server";
import { BUSINESS_ID } from "@/lib/constants";
import { createPrivilegedClient, SERVICE_UNAVAILABLE } from "@/lib/server-db";
import { accountSchema } from "@/lib/validators";

function normPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

// POST /api/account { phone } — akun pelanggan sederhana: daftar event + pembayaran.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nomor tidak valid.", details: parsed.error.errors }, { status: 400 });
  }
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 });
  }
  const want = normPhone(parsed.data.phone);
  const { data: customers } = await client
    .from("customers")
    .select("id,name,phone")
    .eq("business_id", BUSINESS_ID);
  const cust = ((customers ?? []) as Array<{ id: string; name: string; phone: string }>).find(
    (c) => c.phone && normPhone(c.phone) === want
  );
  if (!cust) {
    return NextResponse.json({ error: "Nomor tidak terdaftar. Pesan dulu via halaman Booking." }, { status: 404 });
  }
  const { data: events } = await client
    .from("events")
    .select("id,event_no,title,event_type,event_date,venue_text,status,payment_status,pax_confirmed,pax_final")
    .eq("business_id", BUSINESS_ID)
    .eq("customer_id", cust.id)
    .order("event_date", { ascending: false });
  const { data: quotes } = await client
    .from("quotes")
    .select("id,quote_no,status,total")
    .eq("business_id", BUSINESS_ID)
    .eq("customer_id", cust.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({
    customer: { name: cust.name },
    events: events ?? [],
    quotes: quotes ?? [],
  });
}
