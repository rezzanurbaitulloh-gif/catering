import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { createPrivilegedClient, SERVICE_UNAVAILABLE } from "@/lib/server-db";

function authedClient(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/invoice/[eventId] — invoice milik sendiri (kepemilikan dari sesi).
// Dihitung dari versi quotation TERKUNCI + riwayat pembayaran (append-only).
export async function GET(req: Request, { params }: { params: { eventId: string } }) {
  const authed = authedClient(req);
  if (!authed) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const { data: udata, error: uErr } = await authed.auth.getUser();
  if (uErr || !udata.user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 });
  }
  const { data: cust } = await client
    .from("customers")
    .select("id,business_id,name,phone,email,address")
    .eq("auth_user_id", udata.user.id)
    .maybeSingle();
  const self = cust as { id: string; business_id: string; name: string; phone: string; email: string | null; address: string | null } | null;
  if (!self) return NextResponse.json({ error: "Profil belum tertaut." }, { status: 403 });

  const { data: ev } = await client
    .from("events")
    .select("id,business_id,event_no,title,event_type,event_date,venue_text,pax_quoted,pax_confirmed,pax_final,status,payment_status,customer_id")
    .eq("id", params.eventId)
    .eq("customer_id", self.id)
    .maybeSingle();
  const event = ev as Record<string, unknown> | null;
  if (!event) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });

  const [{ data: booking }, { data: biz }, { data: pays }] = await Promise.all([
    client.from("bookings").select("quote_id").eq("event_id", params.eventId).maybeSingle(),
    client.from("businesses").select("name").eq("id", event.business_id as string).maybeSingle(),
    client.from("payments").select("amount,method,kind,status,received_at,reference").eq("event_id", params.eventId).order("received_at", { ascending: true }),
  ]);
  const b = booking as { quote_id: string | null } | null;
  let quote: Record<string, unknown> | null = null;
  interface QV {
    version: number; pax: number;
    items: Array<{ name: string; qty: number; unit_price: number; per_pax?: boolean }>;
    subtotal: number; discount: number; total: number; created_at: string;
  }
  let version: QV | null = null;
  if (b?.quote_id) {
    const { data: q } = await client.from("quotes").select("quote_no,status,subtotal,discount,total,valid_until").eq("id", b.quote_id).maybeSingle();
    quote = (q ?? null) as Record<string, unknown> | null;
    const { data: vers } = await client
      .from("quote_versions")
      .select("version,pax,items,subtotal,discount,total,created_at")
      .eq("quote_id", b.quote_id)
      .not("approved_at", "is", null)
      .order("version", { ascending: false })
      .limit(1);
    version = ((vers ?? [])[0] ?? null) as unknown as QV | null;
  }
  const payList = (pays ?? []) as Array<{ amount: number; method: string; kind: string; status: string; received_at: string | null; reference: string | null }>;
  const paid = payList.filter((p) => p.status === "PAID" || p.status === "PARTIAL").reduce((a, p) => a + p.amount, 0);
  const total = (version?.total as number | undefined) ?? 0;
  const invoice_no = quote ? `INV-${String(quote.quote_no).replace(/^Q-/, "")}` : `INV-${String(event.event_no).replace(/^EVENT-/, "")}`;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://catering-customer.vercel.app").replace(/\/$/, "");
  const verifyUrl = `${site}/lacak?no=${encodeURIComponent(event.event_no as string)}`;
  let qr = "";
  try {
    qr = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });
  } catch {
    qr = "";
  }
  return NextResponse.json({
    invoice_no,
    issued_at: new Date().toISOString(),
    business: { name: (biz as { name?: string } | null)?.name ?? "Rasa Nusantara Catering" },
    customer: { name: self.name, phone: self.phone, email: self.email, address: self.address },
    event: {
      event_no: event.event_no, title: event.title, event_type: event.event_type,
      event_date: event.event_date, venue: event.venue_text,
      pax: event.pax_final ?? event.pax_confirmed ?? event.pax_quoted,
      status: event.status, payment_status: event.payment_status,
    },
    quote_no: quote?.quote_no ?? null,
    version,
    subtotal: version?.subtotal ?? total,
    discount: version?.discount ?? 0,
    total,
    paid,
    outstanding: Math.max(total - paid, 0),
    payments: payList,
    verify_url: verifyUrl,
    qr,
  });
}
