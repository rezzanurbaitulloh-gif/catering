import { NextResponse } from "next/server";
import { BUSINESS_ID } from "@/lib/constants";
import { createPrivilegedClient, SERVICE_UNAVAILABLE } from "@/lib/server-db";
import { trackSchema } from "@/lib/validators";

function normPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

// GET /api/track?no=EVENT-2026-001&phone=08xxx — hanya milik pemesan (cocok nomor HP).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = trackSchema.safeParse({ no: url.searchParams.get("no"), phone: url.searchParams.get("phone") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Isian belum valid.", details: parsed.error.errors }, { status: 400 });
  }
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 });
  }
  const { data: event, error } = await client
    .from("events")
    .select(
      "id,event_no,title,event_type,event_date,start_at,venue_text,status,payment_status," +
        "pax_estimated,pax_quoted,pax_confirmed,pax_final,pax_locked," +
        "vegetarian,vegan,allergies,dietary_notes,special_instructions,customer_id,venues(name)"
    )
    .eq("business_id", BUSINESS_ID)
    .eq("event_no", parsed.data.no.trim())
    .maybeSingle();
  if (error || !event) {
    return NextResponse.json({ error: "Data tidak ditemukan. Periksa nomor acara." }, { status: 404 });
  }
  const ev = event as unknown as Record<string, unknown>;
  // Verifikasi kepemilikan via nomor HP customer.
  let ownerOk = false;
  if (ev.customer_id) {
    const { data: cust } = await client
      .from("customers")
      .select("phone")
      .eq("id", ev.customer_id as string)
      .maybeSingle();
    const custPhone = (cust as { phone?: string } | null)?.phone ?? "";
    ownerOk = normPhone(custPhone) === normPhone(parsed.data.phone) && custPhone !== "";
  }
  if (!ownerOk) {
    return NextResponse.json(
      { error: "Data tidak ditemukan untuk kombinasi nomor acara & WhatsApp tersebut." },
      { status: 404 }
    );
  }
  const [{ data: payments }, { data: timelines }] = await Promise.all([
    client
      .from("payments")
      .select("amount,method,kind,status,received_at,reference")
      .eq("event_id", ev.id as string)
      .neq("status", "FAILED")
      .order("received_at", { ascending: true }),
    client
      .from("event_timelines")
      .select("label,planned_at,done_at,owner")
      .eq("event_id", ev.id as string)
      .order("planned_at", { ascending: true }),
  ]);
  const payList = (payments ?? []) as Array<{ amount: number; status: string }>;
  const paidTotal = payList
    .filter((p) => p.status === "PAID" || p.status === "PARTIAL")
    .reduce((a, p) => a + (p.amount || 0), 0);
  const venue = (ev.venues as { name?: string } | null)?.name ?? (ev.venue_text as string | null) ?? "—";
  return NextResponse.json({
    event: {
      event_no: ev.event_no,
      title: ev.title,
      event_type: ev.event_type,
      event_date: ev.event_date,
      start_at: ev.start_at,
      venue,
      status: ev.status,
      payment_status: ev.payment_status,
      pax: {
        estimated: ev.pax_estimated,
        quoted: ev.pax_quoted,
        confirmed: ev.pax_confirmed,
        final: ev.pax_final,
        locked: ev.pax_locked,
      },
      dietary: {
        vegetarian: ev.vegetarian,
        vegan: ev.vegan,
        allergies: ev.allergies ?? [],
        notes: ev.dietary_notes,
      },
      special_instructions: ev.special_instructions,
    },
    payments: payments ?? [],
    paidTotal,
    timelines: timelines ?? [],
  });
}
