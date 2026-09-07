import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';
import { derivePaymentStatus } from '@/lib/vendored-pricing';

const body = z.object({
  event_id: z.string().min(1),
  amount: z.number().int().min(1000),
  method: z.enum(['CASH', 'TRANSFER', 'QRIS', 'CARD', 'OTHER']).default('TRANSFER'),
  kind: z.enum(['DP', 'FINAL', 'FULL', 'REFUND', 'OTHER']).default('DP'),
  reference: z.string().max(120).nullable().optional(),
});

// POST /api/payments — catat pembayaran; status event dihitung ulang dari total tagihan.
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const v = body.parse(await req.json().catch(() => ({})));
    const { data: ev } = await supabase
      .from('events')
      .select('id')
      .eq('business_id', businessId)
      .eq('id', v.event_id)
      .maybeSingle();
    if (!ev) return json(404, 'Event tidak ditemukan');
    const { error: insErr } = await supabase.from('payments').insert({
      business_id: businessId,
      event_id: v.event_id,
      amount: v.amount,
      method: v.method,
      kind: v.kind,
      status: 'PAID',
      received_at: new Date().toISOString(),
      reference: v.reference ?? null,
    });
    if (insErr) return json(500, insErr.message);
    // Total tagihan: quote yang terikat booking event ini (fallback: total bayar saat ini).
    const { data: booking } = await supabase
      .from('bookings')
      .select('quote_id,quotes(total)')
      .eq('event_id', v.event_id)
      .maybeSingle();
    const b = booking as { quote_id: string | null; quotes: { total: number } | null } | null;
    const { data: pays } = await supabase
      .from('payments')
      .select('amount')
      .eq('event_id', v.event_id)
      .eq('status', 'PAID');
    const paid = ((pays ?? []) as { amount: number }[]).reduce((a, p) => a + p.amount, 0);
    const expected = b?.quotes?.total && b.quotes.total > 0 ? b.quotes.total : paid;
    const status = derivePaymentStatus(expected, paid);
    await supabase.from('events').update({ payment_status: status }).eq('id', v.event_id);
    return ok({ ok: true, paid, payment_status: status }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, e.errors[0]?.message ?? 'Input tidak valid');
    return json(500, 'Gagal mencatat pembayaran');
  }
}
