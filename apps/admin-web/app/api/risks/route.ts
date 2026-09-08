import { requireAuth, requireCap, json, ok } from '@/lib/server';
import { evaluateRisk, staffNeedForPax } from '@/lib/vendored-risk';
import { hoursUntil } from '@/lib/format';

// GET /api/risks — evaluasi risiko semua event aktif (server-side, bahasa netral).
export async function GET(req: Request) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    await requireCap(supabase, businessId, 'risk_engine');
    const { data: events } = await supabase
      .from('events')
      .select('id,event_no,event_date,start_at,status,payment_status,pax_final,pax_confirmed,pax_locked')
      .eq('business_id', businessId)
      .not('status', 'in', '(COMPLETED,CLOSED)')
      .order('event_date', { ascending: true })
      .limit(50);
    const list = ((events ?? []) as unknown as Array<{
      id: string; event_no: string; event_date: string; start_at: string | null;
      status: string; payment_status: string; pax_final: number | null;
      pax_confirmed: number; pax_locked: boolean;
    }>);
    // Kebutuhan bahan = resep × pax (server) vs stok tersedia.
    const { data: ritems } = await supabase.from('recipe_items').select('recipe_id,ingredient_id,qty_per_yield');
    const [{ data: inv }, { data: ings }] = await Promise.all([
      supabase.from('inventory_items').select('ingredient_id,stock,reserved,ingredients!inner(name,unit)').eq('business_id', businessId),
      supabase.from('ingredients').select('id,name,unit').eq('business_id', businessId),
    ]);
    const nameMap = new Map<string, { name: string; unit: string }>();
    for (const g of ((ings ?? []) as unknown as Array<{ id: string; name: string; unit: string }>)) {
      nameMap.set(g.id, { name: g.name, unit: g.unit });
    }
    const invMap = new Map<string, { name: string; unit: string; avail: number }>();
    for (const r of ((inv ?? []) as unknown as Array<{ ingredient_id: string; stock: number; reserved: number; ingredients: { name: string; unit: string } }>)) {
      invMap.set(r.ingredient_id, { name: r.ingredients.name, unit: r.ingredients.unit, avail: Number(r.stock) - Number(r.reserved) });
    }
    // Estimasi kasar konservatif: tiap event aktif memakai semua resep.
    const need = new Map<string, number>();
    for (const e of list) {
      const pax = e.pax_final ?? e.pax_confirmed;
      for (const ri of ((ritems ?? []) as unknown as Array<{ ingredient_id: string; qty_per_yield: number }>)) {
        need.set(ri.ingredient_id, (need.get(ri.ingredient_id) ?? 0) + (Number(ri.qty_per_yield) / 100) * pax);
      }
    }
    const globalShort = [] as Array<{ ingredient_name: string; shortage: number; unit: string }>;
    for (const [ing, req] of need) {
      const s = invMap.get(ing);
      const avail = s?.avail ?? 0;
      if (req > avail && req > 0) {
        const meta = s ?? nameMap.get(ing);
        globalShort.push({ ingredient_name: meta?.name ?? 'Bahan', shortage: Math.round(req - avail), unit: meta?.unit ?? '' });
      }
    }
    const out = [];
    for (const e of list) {
      const pax = e.pax_final ?? e.pax_confirmed;
      const [{ count: veh }, { data: assign }, { count: open }] = await Promise.all([
        supabase.from('vehicle_assignments').select('id', { count: 'exact', head: true }).eq('event_id', e.id),
        supabase.from('staff_assignments').select('id').eq('event_id', e.id),
        supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('event_id', e.id).not('status', 'in', '(RESOLVED,CLOSED)'),
      ]);
      const relevant = ['PLANNING', 'LOCKED', 'IN_PREPARATION'].includes(e.status) ? globalShort : [];
      out.push(
        evaluateRisk({
          event: {
            id: e.id, event_no: e.event_no, event_date: e.event_date,
            pax_final: e.pax_final, pax_locked: e.pax_locked,
            payment_status: e.payment_status, status: e.status,
          },
          ingredientShortages: relevant,
          vehicleAssigned: (veh ?? 0) > 0,
          staffAssigned: (assign ?? []).length,
          staffRequired: staffNeedForPax(pax),
          equipmentMissing: 0,
          incidentOpen: open ?? 0,
          hoursToEvent: hoursUntil(e.event_date, e.start_at),
        })
      );
    }
    out.sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.level] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.level]));
    return ok({ risks: out });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(500, 'Gagal menghitung risiko');
  }
}
