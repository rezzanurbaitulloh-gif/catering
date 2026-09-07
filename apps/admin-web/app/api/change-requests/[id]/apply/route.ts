import { requireAuth, requireCap, json, ok } from '@/lib/server';

// POST /api/change-requests/[id]/apply — terapkan perubahan yang disetujui ke event.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId, user } = await requireAuth(req);
    await requireCap(supabase, businessId, 'change_request');
    const { data: cr } = await supabase
      .from('change_requests')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const row = cr as { id: string; event_id: string; type: string; payload: Record<string, unknown>; status: string } | null;
    if (!row) return json(404, 'Change request tidak ditemukan');
    if (row.status !== 'APPROVED') return json(409, `Status ${row.status} belum bisa diterapkan (butuh APPROVED)`);
    const p = row.payload ?? {};
    if (row.type === 'PAX' && typeof p.new_pax === 'number') {
      const { data: ev } = await supabase.from('events').select('pax_confirmed,pax_final').eq('id', row.event_id).maybeSingle();
      const e = ev as { pax_confirmed: number; pax_final: number | null } | null;
      await supabase.from('pax_revisions').insert({
        business_id: businessId,
        event_id: row.event_id,
        old_pax: e?.pax_final ?? e?.pax_confirmed ?? null,
        new_pax: p.new_pax,
        reason: `Change request ${params.id}`,
        created_by: user.id,
      });
      await supabase.from('events').update({ pax_confirmed: p.new_pax }).eq('id', row.event_id);
    } else if (row.type === 'DATE' && typeof p.new_date === 'string') {
      await supabase.from('events').update({ event_date: p.new_date }).eq('id', row.event_id);
    } else if (row.type === 'VENUE' && typeof p.new_venue === 'string') {
      await supabase.from('events').update({ venue_text: p.new_venue }).eq('id', row.event_id);
    }
    // Tipe lain (MENU/ADDON/EQUIPMENT/DECOR/DURATION) dicatat sebagai revisi event_items
    // oleh admin via quotation baru — di sini cukup tandai APPLIED agar tidak menggantung.
    await supabase.from('change_requests').update({ status: 'APPLIED' }).eq('id', params.id);
    return ok({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(500, 'Gagal menerapkan change request');
  }
}
