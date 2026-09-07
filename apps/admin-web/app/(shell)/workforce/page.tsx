'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { fmtDate } from '@/lib/format';
import { detectResourceConflict } from '@/lib/vendored-risk';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface Asg { id: string; role: string; staff: { name: string } | null; events?: { event_no: string; event_date: string } | null }

function Work() {
  const { businessId, isDemo } = useBusiness();
  const [staff, setStaff] = useState<Array<{ id: string; name: string; role: string; available: boolean }>>([]);
  const [asg, setAsg] = useState<Asg[] | null>(null);
  const [conflict, setConflict] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data: s, error: sErr }, { data: a, error: aErr }] = await Promise.all([
      sb.from('staff').select('id,name,role,available').eq('business_id', businessId).order('name'),
      sb.from('staff_assignments').select('id,role,staff(name),events!inner(event_no,event_date)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
    ]);
    if (sErr || aErr) { setErr(sErr?.message ?? aErr?.message ?? 'Gagal'); return; }
    setStaff((s ?? []) as unknown as Array<{ id: string; name: string; role: string; available: boolean }>);
    setAsg((a ?? []) as unknown as Asg[]);
    // Deteksi konflik: kebutuhan staf per tanggal vs yang tersedia.
    const { data: evs } = await sb.from('events').select('id,event_date,pax_confirmed').eq('business_id', businessId).not('status', 'in', '(COMPLETED,CLOSED)');
    const byDate = new Map<string, { id: string; staff_need: number }[]>();
    for (const e of (evs ?? []) as unknown as Array<{ id: string; event_date: string; pax_confirmed: number }>) {
      const need = Math.max(4, Math.ceil(e.pax_confirmed / 40));
      const arr = byDate.get(e.event_date) ?? [];
      arr.push({ id: e.id, staff_need: need });
      byDate.set(e.event_date, arr);
    }
    const avail = (s ?? []).filter((x) => (x as { available: boolean }).available).length;
    const msgs: string[] = [];
    for (const [date, arr] of byDate) {
      const r = detectResourceConflict(arr, avail);
      if (r.conflict) msgs.push(`${fmtDate(date)}: ${r.message}`);
    }
    setConflict(msgs.join('\n'));
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data tim" />;

  async function toggleAvail(id: string, cur: boolean) {
    const { error } = await supabaseBrowser().from('staff').update({ available: !cur }).eq('id', id);
    if (error) { setErr(error.message); return; }
    load();
  }

  if (err && !asg) return <ErrorState text={err} retry={load} />;
  if (!asg) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      {conflict ? <p className="card border-danger/40 text-danger mb-3 text-[14px] whitespace-pre-line" role="alert">{conflict}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold mb-2">Tim ({staff.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {staff.map((s) => (
            <button key={s.id} onClick={() => toggleAvail(s.id, s.available)} title="Ketuk untuk ubah ketersediaan"
              className={`pill cursor-pointer ${s.available ? 'bg-leaf text-white' : 'bg-line text-ink'}`}>
              {s.name} · {s.role}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {asg.length === 0 ? <Empty text="Belum ada penugasan." /> : asg.map((a) => (
          <div key={a.id} className="rowcard">
            <p className="text-[15px]"><b>{a.staff?.name ?? '—'}</b> <span className="muted">· {a.role} · {a.events?.event_no} ({a.events?.event_date ? fmtDate(a.events.event_date) : ''})</span></p>
            <Act onClick={async () => {
              const { error } = await supabaseBrowser().from('staff_attendance').insert({ assignment_id: a.id, present: true });
              if (error) setErr(error.message); else setErr(null);
            }}>Hadir ✓</Act>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkforcePage() {
  return (
    <CapabilityGate route="/workforce">
      <PageHeader title="Workforce" sub="Ketersediaan, penugasan, kehadiran, dan deteksi konflik tanggal sama." />
      <Section title="Tim & penugasan"><Work /></Section>
    </CapabilityGate>
  );
}
