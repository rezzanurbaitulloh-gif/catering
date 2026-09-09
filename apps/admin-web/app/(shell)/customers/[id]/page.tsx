'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { rp, fmtDate, fmtDateTime } from '@/lib/format';
import type { CustomerRow } from '@/lib/types';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

interface Full {
  customer: CustomerRow;
  addresses: Array<{ id: string; label: string; address: string }>;
  events: Array<{ id: string; event_no: string; title: string; event_type: string; event_date: string; status: string; payment_status: string }>;
  quotes: Array<{ id: string; quote_no: string; status: string; total: number }>;
  payments: Array<{ amount: number; status: string; event_id: string }>;
  complaints: Array<{ id: string; category: string; message: string; status: string; created_at: string }>;
  refunds: Array<{ id: string; amount: number; status: string; reason: string | null }>;
}

// Customer 360: profil, alamat, event, quote, pembayaran, komplain, refund.
export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { businessId, isDemo } = useBusiness();
  const [d, setD] = useState<Full | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const sb = supabaseBrowser();
      const { data: c, error } = await sb.from('customers').select('*').eq('business_id', businessId).eq('id', params.id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!c) throw new Error('Pelanggan tidak ditemukan');
      const cust = c as CustomerRow;
      const [a, e, q, p, comp, r] = await Promise.all([
        sb.from('customer_addresses').select('id,label,address').eq('customer_id', params.id),
        sb.from('events').select('id,event_no,title,event_type,event_date,status,payment_status').eq('customer_id', params.id).order('event_date', { ascending: false }),
        sb.from('quotes').select('id,quote_no,status,total').eq('customer_id', params.id).order('created_at', { ascending: false }),
        sb.from('payments').select('amount,status,event_id').eq('business_id', businessId),
        sb.from('complaints').select('id,category,message,status,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),
        sb.from('refunds').select('id,amount,status,reason,event_id').eq('business_id', businessId).limit(50),
      ]);
      const evs = ((e.data ?? []) as Full['events']);
      const evIds = new Set(evs.map((x) => x.id));
      setD({
        customer: cust,
        addresses: (a.data ?? []) as Full['addresses'],
        events: evs,
        quotes: (q.data ?? []) as Full['quotes'],
        payments: ((p.data ?? []) as Full['payments']).filter((x) => evIds.has(x.event_id)),
        complaints: (comp.data ?? []) as Full['complaints'],
        refunds: ((r.data ?? []) as Full['refunds']).filter((x) => evIds.has((x as unknown as { event_id: string }).event_id)),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memuat');
    }
  }, [businessId, params.id]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <div><PageHeader title="Pelanggan" /><LoginRequired what="Profil 360 pelanggan" /></div>;
  if (err) return <div><PageHeader title="Pelanggan" /><ErrorState text={err} retry={load} /></div>;
  if (!d) return <Loading />;

  const paid = d.payments.filter((p) => p.status === 'PAID').reduce((a, p) => a + p.amount, 0);
  return (
    <div>
      <PageHeader title={d.customer.name} sub={`${d.customer.phone} · ${d.customer.email ?? 'tanpa email'} · sejak ${d.customer.source ?? '—'}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card"><p className="muted">Event</p><p className="font-display text-[26px]">{d.events.length}</p></div>
        <div className="card"><p className="muted">Total belanja</p><p className="font-display text-[26px]">{rp(d.customer.total_spent || paid)}</p></div>
        <div className="card"><p className="muted">Quotation</p><p className="font-display text-[26px]">{d.quotes.length}</p></div>
        <div className="card"><p className="muted">Komplain</p><p className="font-display text-[26px]">{d.complaints.length}</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Alamat & kontak">
          <p className="text-[14px]">{d.customer.address ?? '—'}</p>
          {d.addresses.map((a) => <p key={a.id} className="text-[14px] mt-1"><b>{a.label}:</b> {a.address}</p>)}
          {d.addresses.length === 0 ? <p className="muted text-[14px]">Belum ada alamat tambahan.</p> : null}
        </Section>
        <Section title="Event & pesanan">
          {d.events.length === 0 ? <Empty text="Belum ada event." /> : d.events.map((e) => (
            <a key={e.id} href={`/events/${e.id}`} className="rowcard mb-1.5">
              <span className="text-[14px]"><b>{e.event_no}</b> · {e.title} · {fmtDate(e.event_date)}</span>
              <span className="flex gap-1.5"><StatusPill status={e.status} /><StatusPill status={e.payment_status} /></span>
            </a>
          ))}
        </Section>
        <Section title="Quotation">
          {d.quotes.length === 0 ? <Empty text="Belum ada quotation." /> : d.quotes.map((q) => (
            <p key={q.id} className="flex justify-between text-[14px] border-b border-line py-1.5">
              <span>{q.quote_no}</span><span><b>{rp(q.total)}</b> <StatusPill status={q.status} /></span>
            </p>
          ))}
        </Section>
        <Section title="Pembayaran & refund">
          {d.payments.length === 0 ? <Empty text="Belum ada pembayaran." /> : d.payments.map((p, i) => (
            <p key={i} className="flex justify-between text-[14px] border-b border-line py-1.5">
              <span>{rp(p.amount)}</span><StatusPill status={p.status} />
            </p>
          ))}
          {d.refunds.map((r) => (
            <p key={r.id} className="flex justify-between text-[14px] border-b border-line py-1.5">
              <span>Refund {rp(r.amount)}{r.reason ? ` · ${r.reason}` : ''}</span><StatusPill status={r.status} />
            </p>
          ))}
        </Section>
        <Section title="Komplain & umpan balik" sub="Riwayat suara pelanggan ini.">
          {d.complaints.length === 0 ? <Empty text="Nihil komplain." /> : d.complaints.slice(0, 10).map((c) => (
            <div key={c.id} className="border-b border-line py-1.5 text-[14px]">
              <p><b>{c.category}</b> · {c.status} · {fmtDateTime(c.created_at)}</p>
              <p className="text-ink/80">{c.message}</p>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
