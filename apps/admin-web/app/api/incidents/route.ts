import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';

const createBody = z.object({
  event_id: z.string().min(1).nullable().optional(),
  category: z.string().min(2).max(80),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string().min(4).max(160),
  description: z.string().min(10).max(5000),
});

// POST /api/incidents — lapor insiden (basic). Nomor otomatis INC-YYYY-XXX.
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const v = createBody.parse(await req.json().catch(() => ({})));
    if (v.event_id) {
      const { data: ev } = await supabase.from('events').select('id').eq('business_id', businessId).eq('id', v.event_id).maybeSingle();
      if (!ev) return json(404, 'Event tidak ditemukan');
    }
    const count = (await supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('business_id', businessId)).count ?? 0;
    const incident_no = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        business_id: businessId,
        event_id: v.event_id ?? null,
        incident_no,
        category: v.category,
        severity: v.severity,
        title: v.title,
        description: v.description,
        status: 'OPEN',
      })
      .select('id')
      .single();
    if (error || !data) return json(500, error?.message ?? 'Gagal membuat insiden');
    return ok({ ok: true, id: (data as { id: string }).id, incident_no }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, e.errors[0]?.message ?? 'Input tidak valid');
    return json(500, 'Gagal membuat insiden');
  }
}
