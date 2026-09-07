import { z } from 'zod';
import { requireAuth, json, ok } from '@/lib/server';
import { InquiryMachine } from '@/lib/vendored-machines';

const patchBody = z.object({ status: z.string().min(1) });

// PATCH /api/inquiries/[id] { status } — majukan status inquiry tervalidasi.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const { status } = patchBody.parse(await req.json().catch(() => ({})));
    const { data: cur } = await supabase
      .from('inquiries')
      .select('id,status')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const row = cur as { id: string; status: string } | null;
    if (!row) return json(404, 'Inquiry tidak ditemukan');
    try {
      InquiryMachine.assert(row.status, status);
    } catch {
      return json(409, `Transisi ${row.status} → ${status} tidak valid`);
    }
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', params.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, status });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof z.ZodError) return json(400, 'Input tidak valid');
    return json(500, 'Gagal memperbarui inquiry');
  }
}

// POST /api/inquiries/[id]/convert — inquiry → customer? + event PLANNING + booking TENTATIVE.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId } = await requireAuth(req);
    const { data: iq } = await supabase
      .from('inquiries')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const row = iq as Record<string, unknown> | null;
    if (!row) return json(404, 'Inquiry tidak ditemukan');
    if (!['NEW', 'CONTACTED', 'QUOTED'].includes(row.status as string)) {
      return json(409, `Inquiry ${row.status} tidak bisa dikonversi`);
    }
    let customerId = row.customer_id as string | null;
    if (!customerId) {
      const { data: c, error: cErr } = await supabase
        .from('customers')
        .insert({
          business_id: businessId,
          name: (row.contact_name as string) || 'Tanpa nama',
          phone: row.contact_phone as string,
          address: (row.venue_text as string) || null,
          source: 'Inquiry',
          notes: (row.menu_notes as string) || null,
        })
        .select('id')
        .single();
      if (cErr || !c) return json(500, cErr?.message ?? 'Gagal membuat customer');
      customerId = (c as { id: string }).id;
    }
    const count = (await supabase.from('events').select('id', { count: 'exact', head: true }).eq('business_id', businessId)).count ?? 0;
    const event_no = `EVENT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const { data: ev, error: evErr } = await supabase
      .from('events')
      .insert({
        business_id: businessId,
        event_no,
        customer_id: customerId,
        title: `${row.event_type} — ${row.contact_name}`,
        event_type: row.event_type,
        event_date: row.event_date,
        venue_text: (row.venue_text as string) || null,
        pax_estimated: row.pax,
        pax_quoted: row.pax,
        pax_confirmed: row.pax,
        status: 'PLANNING',
        payment_status: 'PENDING',
        vegetarian: row.vegetarian ?? 0,
        vegan: row.vegan ?? 0,
        allergies: row.allergies ?? [],
        dietary_notes: (row.dietary_notes as string) || null,
        special_instructions: (row.menu_notes as string) || null,
      })
      .select('id')
      .single();
    if (evErr || !ev) return json(500, evErr?.message ?? 'Gagal membuat event');
    const eventId = (ev as { id: string }).id;
    await supabase.from('bookings').insert({ business_id: businessId, event_id: eventId, status: 'TENTATIVE' });
    await supabase.from('inquiries').update({ status: 'BOOKED', customer_id: customerId }).eq('id', params.id);
    return ok({ ok: true, event_id: eventId, event_no }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return json(500, 'Gagal konversi inquiry');
  }
}
