// Edge Function: calc-quote — kebenaran harga sisi server.
// Deploy: supabase functions deploy calc-quote
// Dipakai Admin Web bila ingin kalkulasi terpusat; API route /api/quotes
// memakai logika identik (packages/business-logic/src/pricing.ts).
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type Item = { name: string; qty: number; unit_price: number; per_pax?: boolean };

function subtotal(items: Item[], pax: number): number {
  if (!Number.isInteger(pax) || pax <= 0) throw new Error('pax invalid');
  let s = 0;
  for (const it of items) {
    if (it.qty < 0 || it.unit_price < 0) throw new Error('negative value');
    s += it.qty * it.unit_price * (it.per_pax === false ? 1 : pax);
  }
  return Math.round(s);
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }
  try {
    const { pax, items, discount = 0 } = (await req.json()) as {
      pax: number;
      items: Item[];
      discount?: number;
    };
    const sub = subtotal(items ?? [], pax);
    if (discount < 0 || discount > sub) {
      return new Response(JSON.stringify({ error: 'discount invalid' }), { status: 400 });
    }
    return new Response(JSON.stringify({ subtotal: sub, discount, total: sub - discount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400 });
  }
});
