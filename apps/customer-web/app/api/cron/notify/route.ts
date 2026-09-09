import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPrivilegedClient } from "@/lib/server-db";

// Engine notifikasi operasional (idempoten per hari).
// Pemicu: Vercel Cron harian (vercel.json) atau tombol admin (Bearer member).
// Aturan: H-7 pax · H-3 pengadaan · H-1 tim/armada/bayar · T-2h berangkat · insiden eskalasi.

function dayBounds(d: Date): { start: string; end: string } {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return { start: s.toISOString(), end: e.toISOString() };
}
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";
  let businessId: string | null = null;

  const authH = req.headers.get("authorization") ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.startsWith("vercel-cron/")) {
    // Pemicu terjadwal resmi Vercel (vercel.json). Idempoten per hari.
    businessId = url.searchParams.get("business_id");
  } else if (authH.startsWith("Bearer ") && cronSecret && key === cronSecret) {
    // mode cron — semua bisnis? batasi: butuh business_id param.
    businessId = url.searchParams.get("business_id");
  } else if (authH.startsWith("Bearer ")) {
    // mode admin manual: validasi sesi member.
    const tmp = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false }, global: { headers: { Authorization: authH } } }
    );
    const { data } = await tmp.auth.getUser();
    if (!data.user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const { data: prof } = await tmp.from("profiles").select("business_id").eq("id", data.user.id).maybeSingle();
    businessId = (prof as { business_id: string | null } | null)?.business_id ?? null;
  } else if (cronSecret && key === cronSecret) {
    businessId = url.searchParams.get("business_id");
  }
  if (!businessId) return NextResponse.json({ error: "business_id / otorisasi wajib." }, { status: 401 });

  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json({ error: "Server belum siap." }, { status: 503 });
  }
  const now = new Date();
  const today = dayBounds(now);
  const created: string[] = [];

  async function already(kind: string, eventId: string): Promise<boolean> {
    const { data } = await client!
      .from("notifications")
      .select("id")
      .eq("business_id", businessId)
      .eq("kind", kind)
      .eq("event_id", eventId)
      .gte("created_at", today.start)
      .limit(1);
    return ((data ?? []) as unknown[]).length > 0;
  }
  async function push(kind: string, title: string, body: string, eventId: string) {
    if (await already(kind, eventId)) return;
    const { error } = await client!.from("notifications").insert({
      business_id: businessId,
      kind,
      title,
      body,
      event_id: eventId,
    });
    if (!error) created.push(`${kind}:${eventId.slice(0, 8)}`);
  }

  const { data: events } = await client
    .from("events")
    .select("id,event_no,title,event_date,start_at,status,payment_status,pax_confirmed,pax_final,pax_locked")
    .eq("business_id", businessId)
    .not("status", "in", "(COMPLETED,CLOSED)")
    .limit(100);
  const list = (events ?? []) as Array<{
    id: string; event_no: string; title: string; event_date: string; start_at: string | null;
    status: string; payment_status: string; pax_confirmed: number; pax_final: number | null; pax_locked: boolean;
  }>;

  for (const e of list) {
    const evDate = new Date(e.event_date + "T00:00:00");
    const diffDays = Math.round((evDate.getTime() - new Date(dateStr(now) + "T00:00:00").getTime()) / 86400000);
    if (diffDays === 7 && !e.pax_locked) {
      await push("PAX_H7", `H-7 ${e.event_no}: pax belum dikunci`, `${e.title} — hubungi pelanggan untuk final pax sebelum belanja.`, e.id);
    }
    if (diffDays <= 3 && diffDays >= 0) {
      const { data: pos } = await client
        .from("purchase_orders")
        .select("id,status")
        .eq("event_id", e.id)
        .neq("status", "RECEIVED")
        .limit(1);
      if (((pos ?? []) as unknown[]).length > 0) {
        await push("PROC_H3", `Pengadaan belum lengkap ${e.event_no}`, `${e.title} — ada PO belum diterima.`, e.id);
      }
    }
    if (diffDays <= 1 && diffDays >= 0) {
      const [{ count: staff }, { count: veh }] = await Promise.all([
        client.from("staff_assignments").select("id", { count: "exact", head: true }).eq("event_id", e.id),
        client.from("vehicle_assignments").select("id", { count: "exact", head: true }).eq("event_id", e.id),
      ]);
      const need = Math.max(4, Math.ceil((e.pax_final ?? e.pax_confirmed) / 40));
      if ((staff ?? 0) < need) {
        await push("STAFF_H1", `Tim belum lengkap ${e.event_no}`, `Terisi ${staff ?? 0}/${need} — tugaskan sebelum H-1.`, e.id);
      }
      if ((veh ?? 0) === 0) {
        await push("VEHICLE_H1", `Armada belum ditetapkan ${e.event_no}`, `${e.title} — tetapkan armada + sopir.`, e.id);
      }
      if (e.payment_status !== "PAID") {
        await push("PAY_H1", `Tagihan belum lunas ${e.event_no}`, `Status ${e.payment_status} — tagih sebelum pengiriman.`, e.id);
      }
    }
    if (diffDays === 0) {
      const { data: tr } = await client.from("transport_tasks").select("id,departed_at").eq("event_id", e.id).limit(10);
      const moved = ((tr ?? []) as Array<{ departed_at: string | null }>).some((t) => t.departed_at);
      if (!moved) {
        await push("TRANSPORT_T2H", `Armada belum berangkat ${e.event_no}`, `${e.title} hari ini — catat keberangkatan.`, e.id);
      }
    }
  }
  // Eskalasi insiden HIGH/CRITICAL terbuka (sekali sehari per insiden).
  const { data: incs } = await client
    .from("incidents")
    .select("id,incident_no,title,event_id")
    .eq("business_id", businessId)
    .in("severity", ["HIGH", "CRITICAL"])
    .not("status", "in", "(RESOLVED,CLOSED)")
    .limit(20);
  for (const i of (incs ?? []) as Array<{ id: string; incident_no: string; title: string; event_id: string | null }>) {
    if (!i.event_id) continue;
    await push("INCIDENT_ESCALATION", `Eskalasi ${i.incident_no}`, `${i.title} — butuh pemilik & tenggat.`, i.event_id);
  }

  return NextResponse.json({ ok: true, created, checked: list.length });
}
