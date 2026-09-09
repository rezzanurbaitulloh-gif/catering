"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import PayOnlineButton from "@/components/PayOnline";
import { useCustomerAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { formatIDR, formatTanggalID } from "@/lib/format";

interface Ev {
  id: string; business_id: string; event_no: string; title: string; event_type: string; event_date: string;
  status: string; payment_status: string; pax_confirmed: number; pax_final: number | null;
  pax_locked: boolean; venue_text: string | null;
}
interface Step { label: string; state: "done" | "now" | "todo"; }

function stepsFor(ev: Ev, o: {
  quoteApproved: boolean; paidRatio: number; hasMenu: boolean;
  producing: boolean; packedOk: boolean | null; arrived: boolean;
}): Step[] {
  const order = ["Booking", "Penawaran disetujui", "DP masuk", "Menu dikonfirmasi", "Pax dikunci", "Produksi", "Packing", "Transport", "Setup", "Layanan", "Selesai"];
  const done = new Set<string>(["Booking"]);
  if (o.quoteApproved) done.add("Penawaran disetujui");
  if (o.paidRatio >= 0.3) done.add("DP masuk");
  if (o.hasMenu) done.add("Menu dikonfirmasi");
  if (ev.pax_locked) done.add("Pax dikunci");
  if (o.producing) done.add("Produksi");
  if (o.packedOk === true) done.add("Packing");
  if (o.arrived) done.add("Transport");
  const flow = ["PLANNING", "LOCKED", "IN_PREPARATION", "IN_TRANSIT", "SETUP", "SERVICE", "BREAKDOWN", "COMPLETED", "CLOSED"];
  const idx = flow.indexOf(ev.status);
  if (idx >= flow.indexOf("SETUP")) done.add("Setup");
  if (idx >= flow.indexOf("SERVICE")) done.add("Layanan");
  if (idx >= flow.indexOf("COMPLETED")) { done.add("Selesai"); done.add("Packing"); done.add("Transport"); }
  let nowSet = false;
  return order.map((label) => {
    if (done.has(label)) return { label, state: "done" as const };
    if (!nowSet) {
      nowSet = true;
      return { label, state: "now" as const };
    }
    return { label, state: "todo" as const };
  });
}

// Portal pelanggan: acara aktif + progres, tagihan, riwayat, notifikasi,
// ubah jadwal/pax, komplain — semua milik sendiri (RLS).
export default function DashboardPanel() {
  const { user, customer, loading } = useCustomerAuth();
  const [events, setEvents] = useState<Ev[]>([]);
  const [quotes, setQuotes] = useState<Array<{ id: string; status: string; total: number }>>([]);
  const [bookings, setBookings] = useState<Array<{ event_id: string; quote_id: string | null }>>([]);
  const [payments, setPayments] = useState<Array<{ event_id: string; amount: number; status: string }>>([]);
  const [items, setItems] = useState<Array<{ event_id: string; required_qty: number | null; packed_qty: number }>>([]);
  const [plans, setPlans] = useState<Array<{ event_id?: string; status: string }>>([]);
  const [transport, setTransport] = useState<Array<{ event_id: string; arrived_at: string | null }>>([]);
  const [notifs, setNotifs] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [cr, setCr] = useState({ event_id: "", type: "PAX", detail: "" });
  const [crMsg, setCrMsg] = useState("");
  const [fb, setFb] = useState({ event_id: "", category: "Layanan", message: "" });
  const [fbMsg, setFbMsg] = useState("");
  const [tab, setTab] = useState<"SEMUA" | "AKTIF" | "SELESAI">("SEMUA");

  const load = useCallback(async () => {
    if (!customer) return;
    setErr("");
    try {
      const sb = supabaseBrowser()!;
      const [eRes, qRes, bRes, pRes, nRes] = await Promise.all([
        sb.from("events").select("id,business_id,event_no,title,event_type,event_date,status,payment_status,pax_confirmed,pax_final,pax_locked,venue_text").eq("customer_id", customer.id).order("event_date", { ascending: false }).limit(50),
        sb.from("quotes").select("id,status,total").eq("customer_id", customer.id).limit(50),
        sb.from("bookings").select("event_id,quote_id").limit(200),
        sb.from("payments").select("event_id,amount,status").limit(200),
        sb.from("notifications").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(20),
      ]);
      const evs = (eRes.data ?? []) as Ev[];
      const ids = evs.map((e) => e.id);
      setEvents(evs);
      setQuotes((qRes.data ?? []) as Array<{ id: string; status: string; total: number }>);
      setBookings(((bRes.data ?? []) as Array<{ event_id: string; quote_id: string | null }>).filter((b) => ids.includes(b.event_id)));
      setPayments(((pRes.data ?? []) as Array<{ event_id: string; amount: number; status: string }>).filter((p) => ids.includes(p.event_id)));
      setNotifs((nRes.data ?? []) as Array<{ id: string; title: string; body: string; created_at: string }>);
      if (ids.length) {
        const [iRes, plRes, tRes] = await Promise.all([
          sb.from("event_items").select("event_id,required_qty,packed_qty").in("event_id", ids),
          sb.from("production_plans").select("event_id,status").in("event_id", ids),
          sb.from("transport_tasks").select("event_id,arrived_at").in("event_id", ids),
        ]);
        setItems((iRes.data ?? []) as Array<{ event_id: string; required_qty: number | null; packed_qty: number }>);
        setPlans(((plRes.data ?? []) as Array<{ status: string }>).map((p) => ({ status: p.status })));
        setTransport((tRes.data ?? []) as Array<{ event_id: string; arrived_at: string | null }>);
      }
      setReady(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat dashboard.");
    }
  }, [customer]);

  useEffect(() => {
    if (customer) load();
  }, [customer, load]);

  if (loading) return <p className="text-sm text-muted">Memuat…</p>;
  if (!user) {
    return (
      <div className="rounded-brand border border-line bg-white p-6 text-center text-sm">
        <p className="font-display text-xl font-bold">Masuk untuk melihat pesanan Anda</p>
        <p className="mt-1 text-ink/70">Dashboard, invoice, progres acara, dan riwayat pembayaran.</p>
        <p className="mt-4 flex justify-center gap-3">
          <Link href="/masuk" className="btn-gold">Masuk</Link>
          <Link href="/daftar" className="btn-outline">Daftar</Link>
        </p>
      </div>
    );
  }
  if (!customer) {
    return <p className="rounded-brand border border-line bg-white p-4 text-sm">Akun belum tertaut ke data pelanggan. <Link href="/profil" className="font-bold underline">Lengkapi profil</Link> atau hubungi admin.</p>;
  }
  if (err) return <p className="error-text" role="alert">{err}</p>;
  if (!ready) return <p className="text-sm text-muted">Memuat dashboard…</p>;

  const active = events.filter((e) => !["COMPLETED", "CLOSED"].includes(e.status));
  const history = events.filter((e) => ["COMPLETED", "CLOSED"].includes(e.status));
  const shown = tab === "AKTIF" ? active : tab === "SELESAI" ? history : events;

  async function submitCR(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setCrMsg("");
    if (!cr.event_id) return setCrMsg("Pilih acara.");
    if (cr.detail.trim().length < 5) return setCrMsg("Jelaskan perubahan (min 5 huruf).");
    const payload: Record<string, unknown> =
      cr.type === "PAX" ? { note: cr.detail } :
      cr.type === "DATE" ? { new_date: cr.detail } :
      { note: cr.detail };
    if (cr.type === "PAX") {
      const m = cr.detail.match(/(\d{2,5})/);
      if (m) payload.new_pax = Number(m[1]);
    }
    const { error } = await supabaseBrowser()!.from("change_requests").insert({
      business_id: events.find((x) => x.id === cr.event_id)?.business_id ?? customer.business_id,
      event_id: cr.event_id,
      type: cr.type,
      payload,
      status: "PENDING",
    });
    setCrMsg(error ? error.message : "Permintaan terkirim — menunggu review admin ✓");
    if (!error) setCr({ event_id: "", type: "PAX", detail: "" });
  }

  async function submitFb(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setFbMsg("");
    if (fb.message.trim().length < 10) return setFbMsg("Ceritakan minimal 10 huruf.");
    const { error } = await supabaseBrowser()!.from("complaints").insert({
      business_id: customer.business_id,
      event_id: fb.event_id || null,
      customer_name: customer.name,
      category: fb.category,
      message: fb.message.trim(),
      status: "OPEN",
    });
    setFbMsg(error ? error.message : "Terkirim — terima kasih atas masukannya ✓");
    if (!error) setFb({ event_id: "", category: "Layanan", message: "" });
  }

  function eventBlock(ev: Ev) {
    const evQuotes = quotes.filter((q) => bookings.some((b) => b.event_id === ev.id && b.quote_id === q.id));
    const approved = evQuotes.some((q) => q.status === "APPROVED");
    const expected = evQuotes.find((q) => q.status === "APPROVED")?.total ?? evQuotes[0]?.total ?? 0;
    const paid = payments.filter((p) => p.event_id === ev.id && (p.status === "PAID" || p.status === "PARTIAL")).reduce((a, p) => a + p.amount, 0);
    const evItems = items.filter((i) => i.event_id === ev.id);
    const hasMenu = evItems.length > 0;
    const packedOk = hasMenu && evItems.every((i) => i.required_qty == null || Number(i.packed_qty) >= Number(i.required_qty)) ? true : hasMenu ? false : null;
    const arrived = transport.some((t) => t.event_id === ev.id && t.arrived_at);
    const steps = stepsFor(ev, { quoteApproved: approved, paidRatio: expected ? paid / expected : 0, hasMenu, producing: plans.length > 0, packedOk, arrived });
    return (
      <article key={ev.id} className="rounded-brand border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-bold">{ev.title}</h3>
          <StatusBadge status={ev.status} />
          <StatusBadge status={ev.payment_status} />
        </div>
        <p className="mt-1 text-sm text-muted">{ev.event_no} · {ev.event_type} · {formatTanggalID(ev.event_date)} · {ev.pax_final ?? ev.pax_confirmed} pax</p>
        <ol className="mt-3 grid gap-1 sm:grid-cols-2">
          {steps.map((s) => (
            <li key={s.label} className={`flex items-center gap-2 text-sm ${s.state === "todo" ? "text-muted" : ""}`}>
              <span aria-hidden="true" className={s.state === "done" ? "text-[#15803D]" : s.state === "now" ? "text-[#B45309]" : "text-line"}>
                {s.state === "done" ? "✓" : s.state === "now" ? "●" : "○"}
              </span>
              {s.label}
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span>Dibayar <strong className="text-[#15803D]">{formatIDR(paid)}</strong>{expected ? ` / ${formatIDR(expected)}` : ""}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/invoice/${ev.id}`} className="btn-outline !px-4 !py-2 text-sm">Invoice</Link>
          <Link href={`/lacak?no=${encodeURIComponent(ev.event_no)}`} className="btn-outline !px-4 !py-2 text-sm">Lacak Detail</Link>
          {ev.payment_status !== "PAID" ? <PayOnlineButton eventId={ev.id} label="Bayar Online" /> : null}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2" role="tablist" aria-label="Filter pesanan">
        {(["SEMUA", "AKTIF", "SELESAI"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`chip ${tab === t ? "chip-active" : ""}`}
          >
            {t === "SEMUA" ? `Semua (${events.length})` : t === "AKTIF" ? `Aktif (${active.length})` : `Selesai (${history.length})`}
          </button>
        ))}
      </div>
      <section aria-labelledby="acara">
        <h2 id="acara" className="sr-only">Daftar pesanan</h2>
        {shown.length === 0 ? (
          <p className="rounded-brand border border-line bg-white p-4 text-sm text-muted">
            {tab === "SEMUA" ? (<>Belum ada pesanan. <Link href="/booking" className="font-bold text-gold-deep underline">Buat permintaan</Link></>) : "Tidak ada pesanan pada tab ini."}
          </p>
        ) : (
          <div className="space-y-3">{shown.map(eventBlock)}</div>
        )}
      </section>

      <section aria-labelledby="notif">
        <h2 id="notif" className="font-display text-xl font-bold">Pemberitahuan ({notifs.length})</h2>
        {notifs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Belum ada pemberitahuan.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notifs.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-brand border border-line bg-white p-3 text-sm">
                <p className="font-bold">{n.title}</p>
                <p className="text-ink/70">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ubah">
        <h2 id="ubah" className="font-display text-xl font-bold">Minta perubahan</h2>
        <form onSubmit={submitCR} className="mt-2 grid gap-2 rounded-brand border border-line bg-white p-4 sm:grid-cols-3" noValidate>
          <select className="field" value={cr.event_id} onChange={(e) => setCr({ ...cr, event_id: e.target.value })} aria-label="Acara">
            <option value="">— Pilih acara —</option>
            {active.map((e) => <option key={e.id} value={e.id}>{e.event_no} · {e.title}</option>)}
          </select>
          <select className="field" value={cr.type} onChange={(e) => setCr({ ...cr, type: e.target.value })} aria-label="Jenis perubahan">
            <option value="PAX">Jumlah tamu</option>
            <option value="DATE">Tanggal</option>
            <option value="VENUE">Lokasi</option>
            <option value="MENU">Menu</option>
            <option value="ADDON">Tambahan</option>
            <option value="DECOR">Dekorasi</option>
            <option value="DURATION">Durasi</option>
          </select>
          <input className="field sm:col-span-2" value={cr.detail} onChange={(e) => setCr({ ...cr, detail: e.target.value })} placeholder="cth: tambah jadi 350 pax / mundur ke 20 Okt" aria-label="Detail perubahan" />
          <button type="submit" className="btn-gold">Kirim Permintaan</button>
        </form>
        {crMsg ? <p className="mt-2 text-sm" role="status">{crMsg}</p> : null}
        <p className="mt-1 text-xs text-muted">Dampak harga & jadwal dihitung admin sebelum disetujui — tidak ada perubahan diam-diam.</p>
      </section>

      <section aria-labelledby="fb">
        <h2 id="fb" className="font-display text-xl font-bold">Saran &amp; keluhan</h2>
        <form onSubmit={submitFb} className="mt-2 grid gap-2 rounded-brand border border-line bg-white p-4 sm:grid-cols-3" noValidate>
          <select className="field" value={fb.event_id} onChange={(e) => setFb({ ...fb, event_id: e.target.value })} aria-label="Acara terkait">
            <option value="">— Umum —</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.event_no}</option>)}
          </select>
          <select className="field" value={fb.category} onChange={(e) => setFb({ ...fb, category: e.target.value })} aria-label="Kategori">
            <option>Layanan</option><option>Makanan</option><option>Porsi</option><option>Waktu</option><option>Lainnya</option>
          </select>
          <input className="field sm:col-span-2" value={fb.message} onChange={(e) => setFb({ ...fb, message: e.target.value })} placeholder="Ceritakan pengalaman Anda…" aria-label="Pesan" />
          <button type="submit" className="btn-outline">Kirim</button>
        </form>
        {fbMsg ? <p className="mt-2 text-sm" role="status">{fbMsg}</p> : null}
      </section>

    </div>
  );
}
