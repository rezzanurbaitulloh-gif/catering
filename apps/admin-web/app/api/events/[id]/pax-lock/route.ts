import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';

const body = z.object({ pax_final: z.number().int().min(1).max(10000) });

// POST /api/events/[id]/pax-lock { pax_final } — kunci final pax + catat revisi.
// Bila masih PLANNING, status ikut maju ke LOCKED (transisi valid).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId, user } = await requireAuth(req);
    const { pax_final } = body.parse(await req.json().catch(() => ({})));
    const { data: ev } = await supabase
      .from('events')
      .select('id,status,pax_confirmed,pax_final')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const cur = ev as { id: string; status: string; pax_confirmed: number; pax_final: number | null } | null;
    if (!cur) return json(404, 'Event tidak ditemukan');
    if (!['PLANNING', 'LOCKED'].includes(cur.status)) {
      return json(409, `Pax hanya bisa dikunci saat PLANNING/LOCKED (saat ini ${cur.status})`);
    }
    await supabase.from('pax_revisions').insert({
      business_id: businessId,
      event_id: params.id,
      old_pax: cur.pax_final ?? cur.pax_confirmed,
      new_pax: pax_final,
      reason: 'Final pax lock',
      created_by: user.id,
    });
    const patch: Record<string, unknown> = { pax_final, pax_confirmed: pax_final, pax_locked: true };
    if (cur.status === 'PLANNING') patch.status = 'LOCKED';
    const { error } = await supabase.from('events').update(patch).eq('id', params.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, pax_final });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, e.errors[0]?.message ?? 'Input tidak valid');
    return json(500, 'Gagal mengunci pax');
  }
}
