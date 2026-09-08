import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrivilegedClient } from "@/lib/server-db";
import { snapCharge } from "@/lib/midtrans";

const body = z.object({
  event_id: z.string().min(1).optional(),
  quote_id: z.string().min(1).optional(),
});

// POST /api/payments/midtrans/charge { event_id? | quote_id? }
// Hitung sisa tagihan SERVER, simpan payment PENDING, kembalikan Snap token.
// Tidak ada nominal dari client yang dipercaya.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || (!parsed.data.event_id && !parsed.data.quote_id)) {
    return NextResponse.json({ error: "event_id atau quote_id wajib." }, { status: 400 });
  }
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json({ error: "Pembayaran daring belum aktif di server." }, { status: 503 });
  }

  // Resolusi event.
  let eventId = parsed.data.event_id ?? null;
  if (!eventId && parsed.data.quote_id) {
    const { data: b } = await client
      .from("bookings")
      .select("event_id")
      .eq("quote_id", parsed.data.quote_id)
      .maybeSingle();
    eventId = ((b as { event_id: string | null } | null)?.event_id) ?? null;
  }
  if (!eventId) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });

  const { data: ev } = await client
    .from("events")
    .select("id,business_id,event_no,title,customer_id")
    .eq("id", eventId)
    .maybeSingle();
  const event = ev as { id: string; business_id: string; event_no: string; title: string; customer_id: string | null } | null;
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });

  const [{ data: booking }, { data: pays }, { data: cust }] = await Promise.all([
    client.from("bookings").select("quote_id,quotes(total)").eq("event_id", event.id).maybeSingle(),
    client.from("payments").select("amount").eq("event_id", event.id).neq("status", "FAILED"),
    event.customer_id
      ? client.from("customers").select("name,phone,email").eq("id", event.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const b = booking as { quotes: { total: number } | null } | null;
  const expected = b?.quotes?.total && b.quotes.total > 0 ? b.quotes.total : 0;
  const paid = ((pays ?? []) as Array<{ amount: number }>).reduce((a, p) => a + (p.amount || 0), 0);
  if (expected <= 0) {
    return NextResponse.json({ error: "Belum ada tagihan resmi (quotation) untuk event ini." }, { status: 409 });
  }
  const outstanding = expected - paid;
  if (outstanding <= 0) {
    return NextResponse.json({ error: "Tagihan sudah lunas.", paid, expected }, { status: 409 });
  }

  const order_id = `RN-${event.event_no}-${Date.now().toString(36).toUpperCase()}`;
  const { error: insErr } = await client.from("payments").insert({
    business_id: event.business_id,
    event_id: event.id,
    amount: outstanding,
    method: "MIDTRANS",
    kind: paid > 0 ? "FINAL" : "DP",
    status: "PENDING",
    reference: order_id,
  });
  if (insErr) return NextResponse.json({ error: "Gagal mencatat tagihan." }, { status: 500 });

  try {
    const c = (cust as { name?: string; phone?: string; email?: string } | null) ?? {};
    const snap = await snapCharge({
      order_id,
      amount: outstanding,
      customerName: c.name,
      customerPhone: c.phone,
      customerEmail: c.email,
    });
    return NextResponse.json({ token: snap.token, redirect_url: snap.redirect_url, order_id, amount: outstanding }, { status: 201 });
  } catch (e) {
    await client.from("payments").update({ status: "FAILED" }).eq("reference", order_id);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Midtrans gagal." }, { status: 502 });
  }
}
