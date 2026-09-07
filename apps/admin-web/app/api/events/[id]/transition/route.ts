import { z } from 'zod';
import { requireAuth, requireCap, json, ok } from '@/lib/server';
import { EventMachine } from '@/lib/vendored-machines';

const body = z.object({ to: z.string().min(1) });

// POST /api/events/[id]/transition { to } — transisi status tervalidasi (mesin + trigger DB).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const { to } = body.parse(await req.json().catch(() => ({})));
    const { data: ev } = await supabase
      .from('events')
      .select('id,status')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const cur = (ev as { id: string; status: string } | null)?.status;
    if (!cur) return json(404, 'Event tidak ditemukan');
    try {
      EventMachine.assert(cur, to);
    } catch {
      return json(409, `Transisi ${cur} → ${to} tidak valid`);
    }
    const { error } = await supabase.from('events').update({ status: to }).eq('id', params.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, from: cur, to });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, e.errors[0]?.message ?? 'Input tidak valid');
    return json(500, 'Gagal memperbarui status');
  }
}
