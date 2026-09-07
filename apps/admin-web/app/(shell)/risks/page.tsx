'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import type { EventRisk } from '@/lib/vendored-risk';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

// Risk Center: daftar risiko operasional dengan bahasa netral (tanpa menyalahkan staf).
function RiskList() {
  const { isDemo } = useBusiness();
  const [risks, setRisks] = useState<EventRisk[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await apiJson<{ risks: EventRisk[] }>('/api/risks');
      setRisks(r.risks);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menghitung risiko');
    }
  }, []);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);

  if (isDemo) return <LoginRequired what="Evaluasi risiko" />;
  if (err) return <ErrorState text={err} retry={load} />;
  if (!risks) return <Loading label="Menghitung risiko…" />;

  const high = risks.filter((r) => r.level === 'HIGH').length;
  return (
    <div>
      <p className="muted mb-3">{risks.length} event aktif · <b className="text-danger">{high} risiko tinggi</b>. Bahasa operasional netral — fokus ke tindakan, bukan orang.</p>
      <div className="flex flex-col gap-2">
        {risks.length === 0 ? <Empty text="Tidak ada event aktif." /> : risks.map((r) => (
          <Link key={r.event_id} href={`/events/${r.event_id}`} className="card hover:bg-cream">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.event_no}</p>
              <StatusPill status={r.level} />
            </div>
            {r.reasons.length === 0 ? (
              <p className="muted mt-1">Terkendali — tidak ada temuan.</p>
            ) : (
              <ul className="mt-1.5 list-disc pl-5 text-[14px]">
                {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RisksPage() {
  return (
    <CapabilityGate route="/risks">
      <PageHeader title="Risk Center" sub="Deteksi dini: pembayaran, produksi, stok, staf, armada, venue, timeline." />
      <Section title="Risiko event aktif"><RiskList /></Section>
    </CapabilityGate>
  );
}
