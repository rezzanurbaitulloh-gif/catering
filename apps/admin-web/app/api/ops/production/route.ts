import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';
import { ProductionMachine } from '@/lib/vendored-machines';

const body = z.object({ to: z.string().min(1) });
const TABLES = ['production_plans', 'production_batches'] as const;

// POST /api/ops/production { table, id, to } — transisi produksi tervalidasi.
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const v = z.object({ table: z.enum(TABLES), id: z.string().min(1), to: z.string().min(1) }).parse(
      await req.json().catch(() => ({}))
    );
    void body;
    const { data: cur } = await supabase.from(v.table).select('id,status').eq('id', v.id).maybeSingle();
    const row = cur as { id: string; status: string } | null;
    if (!row) return json(404, 'Data tidak ditemukan');
    // Kepemilikan: plan punya business_id; batch via plan.
    if (v.table === 'production_plans') {
      const { data: own } = await supabase.from('production_plans').select('id').eq('business_id', businessId).eq('id', v.id).maybeSingle();
      if (!own) return json(404, 'Data tidak ditemukan');
    } else {
      const { data: own } = await supabase
        .from('production_batches')
        .select('id,production_plans!inner(business_id)')
        .eq('id', v.id)
        .maybeSingle();
      const b = own as { production_plans: { business_id: string } } | null;
      if (!b || b.production_plans.business_id !== businessId) return json(404, 'Data tidak ditemukan');
    }
    try {
      ProductionMachine.assert(row.status, v.to);
    } catch {
      return json(409, `Transisi ${row.status} → ${v.to} tidak valid`);
    }
    const { error } = await supabase.from(v.table).update({ status: v.to }).eq('id', v.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, status: v.to });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, 'Input tidak valid');
    return json(500, 'Gagal memperbarui produksi');
  }
}
