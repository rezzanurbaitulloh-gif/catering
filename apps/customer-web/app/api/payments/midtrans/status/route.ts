import { NextResponse } from "next/server";
import { createPrivilegedClient, SERVICE_UNAVAILABLE } from "@/lib/server-db";

// GET /api/payments/midtrans/status?order_id=RN-... — status pembayaran + event.
export async function GET(req: Request) {
  const order_id = new URL(req.url).searchParams.get("order_id")?.trim();
  if (!order_id) return NextResponse.json({ error: "order_id wajib." }, { status: 400 });
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 });
  }
  const { data: pay } = await client
    .from("payments")
    .select("amount,method,kind,status,received_at,event_id,events(event_no,title,payment_status)")
    .eq("reference", order_id)
    .maybeSingle();
  if (!pay) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  const p = pay as {
    amount: number; method: string; kind: string; status: string; received_at: string | null;
    events: { event_no: string; title: string; payment_status: string } | null;
  };
  return NextResponse.json({
    order_id,
    amount: p.amount,
    method: p.method,
    kind: p.kind,
    status: p.status,
    received_at: p.received_at,
    event: p.events,
  });
}
