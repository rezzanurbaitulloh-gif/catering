import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/server-db";
import { verifySignature } from "@/lib/midtrans";

interface Notify {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}

// POST /api/payments/midtrans/notify — webhook Midtrans (tanpa auth,
// diverifikasi via signature_key). URL ini yang dipasang di dashboard Midtrans.
export async function POST(req: Request) {
  const n = (await req.json().catch(() => ({}))) as Notify;
  if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }
  if (!verifySignature({ order_id: n.order_id, status_code: n.status_code, gross_amount: n.gross_amount, signature_key: n.signature_key })) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 403 });
  }
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json({ error: "Server belum siap." }, { status: 503 });
  }
  const { data: pay } = await client
    .from("payments")
    .select("id,event_id,amount")
    .eq("reference", n.order_id)
    .maybeSingle();
  const payment = pay as { id: string; event_id: string; amount: number } | null;
  if (!payment) return NextResponse.json({ ok: true, note: "order tidak dikenal" });

  let status = "PENDING";
  if (n.transaction_status === "settlement") status = "PAID";
  else if (n.transaction_status === "capture") status = n.fraud_status === "challenge" ? "PENDING" : "PAID";
  else if (["deny", "cancel", "expire"].includes(n.transaction_status ?? "")) status = "FAILED";

  await client
    .from("payments")
    .update({
      status,
      method: `MIDTRANS-${(n.payment_type ?? "QRIS").toUpperCase()}`,
      received_at: status === "PAID" ? new Date().toISOString() : null,
    })
    .eq("id", payment.id);

  // Hitung ulang status pembayaran event.
  const [{ data: booking }, { data: pays }] = await Promise.all([
    client.from("bookings").select("quote_id,quotes(total)").eq("event_id", payment.event_id).maybeSingle(),
    client.from("payments").select("amount").eq("event_id", payment.event_id).eq("status", "PAID"),
  ]);
  const b = booking as { quotes: { total: number } | null } | null;
  const expected = b?.quotes?.total && b.quotes.total > 0 ? b.quotes.total : 0;
  const paid = ((pays ?? []) as Array<{ amount: number }>).reduce((a, p) => a + p.amount, 0);
  const next = expected <= 0 ? "PARTIAL" : paid >= expected ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  await client.from("events").update({ payment_status: next }).eq("id", payment.event_id);

  return NextResponse.json({ ok: true, payment: status, event_payment: next });
}
