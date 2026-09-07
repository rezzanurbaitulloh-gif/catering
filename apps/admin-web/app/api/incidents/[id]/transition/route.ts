import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';
import { IncidentMachine } from '@/lib/vendored-machines';

const body = z.object({ to: z.string().min(1), resolution_note: z.string().max(2000).nullable().optional() });

// POST /api/incidents/[id]/transition { to, resolution_note? }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const v = body.parse(await req.json().catch(() => ({})));
    const { data: cur } = await supabase
      .from('incidents')
      .select('id,status')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const row = cur as { id: string; status: string } | null;
    if (!row) return json(404, 'Insiden tidak ditemukan');
    try {
      IncidentMachine.assert(row.status, v.to);
    } catch {
      return json(409, `Transisi ${row.status} → ${v.to} tidak valid`);
    }
    const patch: Record<string, unknown> = { status: v.to };
    if (v.to === 'RESOLVED') {
      patch.resolution_note = v.resolution_note ?? null;
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('incidents').update(patch).eq('id', params.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, status: v.to });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, 'Input tidak valid');
    return json(500, 'Gagal memperbarui insiden');
  }
}
