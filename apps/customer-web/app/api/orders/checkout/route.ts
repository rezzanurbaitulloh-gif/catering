import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const body = z.object({ quote_id: z.string().min(1) });

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

function normPhone(p: string): string {
  const d = (p ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

// POST /api/orders/checkout { quote_id } — finalisasi pesanan (WAJIB login).
// Identitas customer dari sesi (RLS), bukan dari body. Menyetujui quote yang
// sudah APPROVED milik sendiri (atau klaim via nomor HP) → event + booking.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "quote_id wajib." }, { status: 400 });
  const supabase = authedClient(req);
  if (!supabase) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const { data: udata, error: uErr } = await supabase.auth.getUser();
  if (uErr || !udata.user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  // Customer milik sesi.
  const { data: me } = await supabase
    .from("customers")
    .select("id,business_id,name,phone")
    .eq("auth_user_id", udata.user.id)
    .maybeSingle();
  const self = me as { id: string; business_id: string; name: string; phone: string } | null;
  if (!self) return NextResponse.json({ error: "Lengkapi profil dulu." }, { status: 403 });

  // Quote harus APPROVED.
  const { data: q } = await supabase
    .from("quotes")
    .select("id,business_id,customer_id,quote_no,status,total,inquiry_id")
    .eq("id", parsed.data.quote_id)
    .maybeSingle();
  const quote = q as {
    id: string; business_id: string; customer_id: string | null;
    quote_no: string; status: string; total: number; inquiry_id: string | null;
  } | null;
  if (!quote || quote.status !== "APPROVED") {
    return NextResponse.json({ error: "Quotation belum disetujui / tidak ditemukan." }, { status: 404 });
  }

  // Kepemilikan: langsung milik sendiri, atau klaim via nomor HP (satu kali).
  if (quote.customer_id !== self.id) {
    if (!quote.customer_id) return NextResponse.json({ error: "Quotation tanpa pelanggan." }, { status: 409 });
    const { data: owner } = await supabase.from("customers").select("id,phone,auth_user_id").eq("id", quote.customer_id).maybeSingle();
    const o = owner as { id: string; phone: string; auth_user_id: string | null } | null;
    if (!o || o.auth_user_id || normPhone(o.phone) !== normPhone(self.phone)) {
      return NextResponse.json({ error: "Quotation ini milik pelanggan lain." }, { status: 403 });
    }
    // Klaim: pakai service client agar RLS klaim lintas-baris lolos.
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { persistSession: false } }
    );
    const { error: claimErr } = await svc.from("customers").update({ auth_user_id: null }).eq("id", self.id);
    if (claimErr) return NextResponse.json({ error: "Gagal menautkan akun." }, { status: 500 });
    // Gabung: pindahkan akun sesi ke baris customer pemilik quote.
    const { error: mergeErr } = await svc.from("customers").update({ auth_user_id: udata.user.id }).eq("id", o.id);
    if (mergeErr) return NextResponse.json({ error: "Gagal menautkan akun." }, { status: 500 });
    await svc.from("customers").delete().eq("id", self.id);
    quote.customer_id = o.id;
  }

  // Idempoten: booking untuk quote ini sudah ada?
  const { data: existing } = await supabase
    .from("bookings")
    .select("id,event_id,events!inner(event_no)")
    .eq("quote_id", quote.id)
    .maybeSingle();
  if (existing) {
    const ex = existing as unknown as { id: string; event_id: string; events: { event_no: string } };
    return NextResponse.json({ ok: true, event_id: ex.event_id, event_no: ex.events.event_no, reused: true });
  }

  // Buat event dari quote versi approved (server-side).
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
  const { data: vers } = await svc
    .from("quote_versions")
    .select("id,pax,items")
    .eq("quote_id", quote.id)
    .not("approved_at", "is", null)
    .order("version", { ascending: false })
    .limit(1);
  const latest = (vers ?? [])[0] as { id: string; pax: number; items: Array<{ name: string; qty: number; unit_price: number; per_pax?: boolean }> } | undefined;
  const pax = latest?.pax ?? 100;

  const { data: inq } = quote.inquiry_id
    ? await svc.from("inquiries").select("event_type,event_date,venue_text,menu_notes,vegetarian,vegan,allergies,dietary_notes").eq("id", quote.inquiry_id).maybeSingle()
    : { data: null };
  const iq = (inq ?? {}) as {
    event_type?: string; event_date?: string; venue_text?: string | null; menu_notes?: string | null;
    vegetarian?: number; vegan?: number; allergies?: string[]; dietary_notes?: string | null;
  };
  const count = (await svc.from("events").select("id", { count: "exact", head: true }).eq("business_id", quote.business_id)).count ?? 0;
  const event_no = `EVENT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const { data: ev, error: evErr } = await svc
    .from("events")
    .insert({
      business_id: quote.business_id,
      event_no,
      customer_id: quote.customer_id,
      title: `${iq.event_type ?? "Acara"} — ${self.name}`,
      event_type: iq.event_type ?? "Lainnya",
      event_date: iq.event_date ?? new Date().toISOString().slice(0, 10),
      venue_text: iq.venue_text ?? null,
      pax_estimated: pax,
      pax_quoted: pax,
      pax_confirmed: pax,
      status: "PLANNING",
      payment_status: "PENDING",
      approved_quote_version_id: latest?.id ?? null,
      vegetarian: iq.vegetarian ?? 0,
      vegan: iq.vegan ?? 0,
      allergies: iq.allergies ?? [],
      dietary_notes: iq.dietary_notes ?? null,
      special_instructions: iq.menu_notes ?? null,
    })
    .select("id")
    .single();
  if (evErr || !ev) return NextResponse.json({ error: "Gagal membuat event." }, { status: 500 });
  const eventId = (ev as { id: string }).id;

  // Snapshot item ke event_items (packing lines).
  if (latest?.items?.length) {
    await svc.from("event_items").insert(
      latest.items.map((it) => ({
        event_id: eventId,
        name: it.name,
        qty: it.per_pax === false ? it.qty : it.qty * pax,
        unit: "porsi",
        category: "FOOD",
        required_qty: it.per_pax === false ? it.qty : it.qty * pax,
        packed_qty: 0,
      }))
    );
  }
  await svc.from("bookings").insert({ business_id: quote.business_id, event_id: eventId, quote_id: quote.id, status: "CONFIRMED" });
  if (quote.inquiry_id) {
    await svc.from("inquiries").update({ status: "BOOKED", customer_id: quote.customer_id }).eq("id", quote.inquiry_id);
  }
  return NextResponse.json({ ok: true, event_id: eventId, event_no }, { status: 201 });
}
