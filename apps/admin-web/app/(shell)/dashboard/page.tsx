'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { todayISO, rp, fmtDate } from '@/lib/format';
import type { EventRow, InquiryRow, IncidentRow } from '@/lib/types';
import { PageHeader, Section, Stat, StatusPill, Loading, LoginRequired, Empty } from '@/components/ui';

interface DashState {
  today: EventRow[];
  upcoming: EventRow[];
  inquiries: InquiryRow[];
  unpaid: EventRow[];
  incidents: IncidentRow[];
  needsLogin: boolean;
}

export default function DashboardPage() {
  const { businessId, isDemo } = useBusiness();
  const [s, setS] = useState<DashState | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = supabaseBrowser();
        const today = todayISO();
        const q = (t: string) => sb.from(t).select('*').eq('business_id', businessId);
        const [t, u, iq, un, inc] = await Promise.all([
          q('events').eq('event_date', today).order('start_at', { ascending: true }),
          q('events').gt('event_date', today).order('event_date', { ascending: true }).limit(8),
          q('inquiries').eq('status', 'NEW').order('created_at', { ascending: false }).limit(8),
          q('events').neq('payment_status', 'PAID').order('event_date', { ascending: true }).limit(8),
          q('incidents').not('status', 'in', '(RESOLVED,CLOSED)').order('created_at', { ascending: false }).limit(8),
        ]);
        // Tabel privat + anon tanpa sesi → RLS menolak (error) → tandai login-required.
        const denied = [t, u, iq, un, inc].some((r) => r.error);
        if (!alive) return;
        setS({
          today: ((t.data ?? []) as unknown as EventRow[]).filter((e) => e.status !== 'CLOSED'),
          upcoming: (u.data ?? []) as unknown as EventRow[],
          inquiries: (iq.data ?? []) as unknown as InquiryRow[],
          unpaid: (un.data ?? []) as unknown as EventRow[],
          incidents: (inc.data ?? []) as unknown as IncidentRow[],
          needsLogin: denied && isDemo,
        });
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Gagal memuat dashboard');
      }
    })();
    return () => {
      alive = false;
    };
  }, [businessId, isDemo]);

  if (err) return <PageHeader title="Dashboard" sub={err} />;
  if (!s) return <Loading label="Memuat operasional hari ini…" />;

  const attention: { label: string; href: string; detail: string }[] = [
    ...s.inquiries.map((i) => ({
      label: `Inquiry baru: ${i.contact_name || 'Tanpa nama'} (${i.pax} pax)`,
      href: '/orders',
      detail: `Butuh dihubungi — ${fmtDate(i.event_date)}`,
    })),
    ...s.unpaid.map((e) => ({
      label: `${e.event_no} belum lunas (${e.payment_status})`,
      href: `/events/${e.id}`,
      detail: `Acara ${fmtDate(e.event_date)}`,
    })),
    ...s.incidents.map((i) => ({
      label: `Insiden: ${i.title}`,
      href: '/incidents',
      detail: `${i.incident_no} · ${i.status}`,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub={`Hari ini ${fmtDate(todayISO())} — apa yang butuh perhatian, apa yang jalan hari ini, apa yang berisiko.`}
      />
      {s.needsLogin ? (
        <div className="mb-4">
          <LoginRequired what="Data operasional privat (acara, inquiry, insiden)" />
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Acara hari ini" value={String(s.today.length)} sub="perlu eksekusi" />
        <Stat label="Inquiry baru" value={String(s.inquiries.length)} sub="perlu dihubungi" />
        <Stat label="Belum lunas" value={String(s.unpaid.length)} sub="perlu ditagih" />
        <Stat label="Insiden terbuka" value={String(s.incidents.length)} sub="perlu tindakan" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Perlu perhatian" sub="Urut prioritas: uang, pelanggan baru, masalah lapangan.">
          {attention.length === 0 ? (
            <Empty text="Nihil — semua terkendali." hint="Tidak ada inquiry baru, tunggakan, atau insiden terbuka." />
          ) : (
            <div className="flex flex-col gap-2">
              {attention.slice(0, 10).map((a, i) => (
                <Link key={i} href={a.href} className="rowcard hover:bg-cream">
                  <p className="font-semibold text-[15px]">{a.label}</p>
                  <p className="muted">{a.detail} →</p>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Acara hari ini" sub="Eksekusi: dapur → kirim → setup → layanan.">
          {s.today.length === 0 ? (
            <Empty text="Tidak ada acara hari ini." hint="Lihat acara mendatang di bawah." />
          ) : (
            <div className="flex flex-col gap-2">
              {s.today.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="rowcard hover:bg-cream md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-semibold text-[15px]">{e.event_no} — {e.title}</p>
                    <p className="muted">
                      {e.pax_final ?? e.pax_confirmed ?? e.pax_estimated} pax · {e.venue_text ?? 'Venue terdaftar'}
                    </p>
                  </div>
                  <StatusPill status={e.status} />
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Mendatang" sub="8 acara terdekat.">
          {s.upcoming.length === 0 ? (
            <Empty text="Belum ada acara mendatang." />
          ) : (
            <div className="flex flex-col gap-2">
              {s.upcoming.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="rowcard hover:bg-cream md:grid-cols-[1fr_auto_auto]">
                  <div>
                    <p className="font-semibold text-[15px]">{e.event_no} — {e.title}</p>
                    <p className="muted">{fmtDate(e.event_date)}</p>
                  </div>
                  <StatusPill status={e.status} />
                  <StatusPill status={e.payment_status} />
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Kas & risiko singkat" sub="Ringkasan cepat; detail di Finance & Risks.">
          <div className="flex flex-col gap-2">
            <div className="card !bg-cream">
              <p className="font-semibold text-[15px]">Belum lunas: {s.unpaid.length} acara</p>
              <p className="muted">Tagih DP/pelunasan sebelum pengiriman (H-1).</p>
              <Link href="/finance" className="text-gold font-semibold text-[14px]">Buka Finance →</Link>
            </div>
            <div className="card !bg-cream">
              <p className="font-semibold text-[15px]">Insiden terbuka: {s.incidents.length}</p>
              <p className="muted">Setiap insiden butuh pemilik & bukti.</p>
              <Link href="/incidents" className="text-gold font-semibold text-[14px]">Buka Incidents →</Link>
            </div>
            <div className="card !bg-cream">
              <p className="font-semibold text-[15px]">Contoh nilai paket</p>
              <PublicPackages />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

/** Bukti tabel publik tetap terbaca saat mode demo (anon). */
function PublicPackages() {
  const [rows, setRows] = useState<{ name: string; base_price_per_pax: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabaseBrowser()
          .from('packages')
          .select('name,base_price_per_pax')
          .eq('is_active', true)
          .limit(3);
        setRows((data ?? []) as unknown as { name: string; base_price_per_pax: number }[]);
      } catch {
        setRows([]);
      }
    })();
  }, []);
  if (rows.length === 0) return <p className="muted">Katalog tidak tersedia.</p>;
  return (
    <ul className="mt-1">
      {rows.map((p) => (
        <li key={p.name} className="text-[14px]">
          {p.name} — <b>{rp(p.base_price_per_pax)}/pax</b>
        </li>
      ))}
    </ul>
  );
}
