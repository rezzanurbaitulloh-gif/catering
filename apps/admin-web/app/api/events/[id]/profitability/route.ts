import { requireAuth, requireCap, json, ok } from '@/lib/server';
import { profitability } from '@/lib/vendored-pricing';

// GET /api/events/[id]/profitability — estimasi vs aktual per event.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    await requireCap(supabase, businessId, 'profitability');
    const { data: ev } = await supabase
      .from('events')
      .select('id')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    if (!ev) return json(404, 'Event tidak ditemukan');
    const [{ data: booking }, { data: expenses }, { data: pays }] = await Promise.all([
      supabase.from('bookings').select('quote_id,quotes(total)').eq('event_id', params.id).maybeSingle(),
      supabase.from('expenses').select('category,amount').eq('event_id', params.id),
      supabase.from('payments').select('amount').eq('event_id', params.id).eq('status', 'PAID'),
    ]);
    const b = booking as { quotes: { total: number } | null } | null;
    const revenue = b?.quotes?.total ?? 0;
    const byCat = new Map<string, number>();
    for (const x of (expenses ?? []) as Array<{ category: string; amount: number }>) {
      byCat.set(x.category, (byCat.get(x.category) ?? 0) + x.amount);
    }
    const pick = (...keys: string[]) => keys.reduce((a, k) => a + (byCat.get(k) ?? 0), 0);
    const food = pick('Bahan Baku', 'Food', 'Belanja');
    const labor = pick('Tenaga Kerja', 'Labor', 'Gaji');
    const transport = pick('Transport', 'Transportasi', 'BBM');
    const vendor = pick('Vendor', 'Sewa');
    const other = [...byCat.entries()].filter(([k]) => !['Bahan Baku', 'Food', 'Belanja', 'Tenaga Kerja', 'Labor', 'Gaji', 'Transport', 'Transportasi', 'BBM', 'Vendor', 'Sewa'].includes(k)).reduce((a, [, v]) => a + v, 0);
    const { profit, margin_pct } = profitability({ revenue, food, labor, transport, vendor, other });
    const paid = ((pays ?? []) as { amount: number }[]).reduce((a, p) => a + p.amount, 0);
    return ok({
      revenue, food_cost: food, labor_cost: labor, transport_cost: transport,
      vendor_cost: vendor, other_cost: other,
      estimated_profit: profit, margin_pct, paid, outstanding: Math.max(revenue - paid, 0),
      expenses: expenses ?? [],
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(500, 'Gagal menghitung profitabilitas');
  }
}
