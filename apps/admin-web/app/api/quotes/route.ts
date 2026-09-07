import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';
import { calcSubtotal, type QuoteItemInput } from '@/lib/vendored-pricing';

const item = z.object({
  name: z.string().min(1).max(160),
  qty: z.number().min(0),
  unit_price: z.number().int().min(0),
  per_pax: z.boolean().optional(),
});
const body = z.object({
  customer_id: z.string().min(1).nullable().optional(),
  inquiry_id: z.string().min(1).nullable().optional(),
  pax: z.number().int().min(1).max(10000),
  items: z.array(item).min(1),
  discount: z.number().int().min(0).default(0),
});

// POST /api/quotes — buat quotation; subtotal dihitung SERVER (client tidak dipercaya).
export async function POST(req: Request) {
  try {
    const { supabase, businessId, user } = await requireAuth(req);
    const v = body.parse(await req.json().catch(() => ({})));
    const items = v.items as QuoteItemInput[];
    const subtotal = calcSubtotal(items, v.pax);
    if (v.discount > subtotal) return json(400, 'Diskon melebihi subtotal');
    const total = subtotal - v.discount;
    const quote_no = `Q-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const { data: q, error: qErr } = await supabase
      .from('quotes')
      .insert({
        business_id: businessId,
        inquiry_id: v.inquiry_id ?? null,
        customer_id: v.customer_id ?? null,
        quote_no,
        status: 'DRAFT',
        subtotal,
        discount: v.discount,
        total,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (qErr || !q) return json(500, qErr?.message ?? 'Gagal membuat quotation');
    const qid = (q as { id: string }).id;
    const { data: ver, error: vErr } = await supabase
      .from('quote_versions')
      .insert({
        quote_id: qid,
        version: 1,
        pax: v.pax,
        items,
        subtotal,
        discount: v.discount,
        total,
        change_summary: 'Versi awal',
        created_by: user.id,
      })
      .select('id')
      .single();
    if (vErr || !ver) return json(500, vErr?.message ?? 'Gagal membuat versi quotation');
    await supabase.from('quote_items').insert(
      items.map((it) => ({
        version_id: (ver as { id: string }).id,
        name: it.name,
        qty: it.qty,
        unit_price: it.unit_price,
        per_pax: it.per_pax ?? true,
      }))
    );
    if (v.inquiry_id) {
      await supabase.from('inquiries').update({ status: 'QUOTED' }).eq('id', v.inquiry_id);
    }
    return ok({ ok: true, id: qid, quote_no, total }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, e.errors[0]?.message ?? 'Input tidak valid');
    if (e instanceof Error && e.message.includes('pax')) return json(400, e.message);
    return json(500, 'Gagal membuat quotation');
  }
}
