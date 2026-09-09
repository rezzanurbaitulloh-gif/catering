'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { PageHeader, Section, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface N { id: string; kind: string; title: string; body: string; event_id: string | null; read_at: string | null; created_at: string }

// Notifikasi operasional + tombol jalankan pengecekan aturan sekarang.
export default function NotificationsPage() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<N[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as N[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <div><PageHeader title="Notifikasi" /><LoginRequired what="Notifikasi operasional" /></div>;

  async function runChecks() {
    setBusy(true);
    setResult("");
    setErr(null);
    try {
      // Engine tinggal di customer-web (pemegang service key); admin memicu dengan sesinya.
      const base = process.env.NEXT_PUBLIC_CUSTOMER_WEB_URL ?? 'https://catering-customer.vercel.app';
      const r = await apiJson<{ created: string[]; checked: number }>(`${base}/api/cron/notify?business_id=${businessId}`, { method: 'GET' });
      setResult(`Dicek ${r.checked} event · ${r.created.length} notifikasi baru.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menjalankan pengecekan');
    } finally {
      setBusy(false);
    }
  }

  async function markRead(id: string) {
    await supabaseBrowser().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  if (err && !rows) return <div><PageHeader title="Notifikasi" /><ErrorState text={err} retry={load} /></div>;
  if (!rows) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        sub="H-7 pax · H-3 pengadaan · H-1 tim/armada/bayar · keberangkatan · eskalasi insiden."
        action={<Act tone="gold" onClick={runChecks} disabled={busy}>{busy ? '…' : 'Jalankan pengecekan'}</Act>}
      />
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      {result ? <p className="card border-leaf/40 text-leaf mb-3 text-[14px]" role="status">{result}</p> : null}
      <Section title={`Kotak masuk (${rows.filter((r) => !r.read_at).length} belum dibaca)`}>
        {rows.length === 0 ? <Empty text="Belum ada notifikasi." hint="Jalankan pengecekan atau tunggu cron harian." /> : (
          <div className="flex flex-col gap-2">
            {rows.map((n) => (
              <div key={n.id} className={`rowcard ${n.read_at ? '' : '!border-gold/50 !bg-gold-soft/40'}`}>
                <div>
                  <p className="font-semibold text-[15px]">{n.title}</p>
                  <p className="text-[14px] text-ink/70">{n.body}</p>
                  <p className="muted">{n.kind} · {fmtDateTime(n.created_at)}</p>
                </div>
                {!n.read_at ? <Act onClick={() => markRead(n.id)}>Tandai dibaca</Act> : null}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
