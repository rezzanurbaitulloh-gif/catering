import { requireAuth, json, ok } from '@/lib/server';
import { QuoteMachine } from '@/lib/vendored-machines';

// POST /api/quotes/[id]/approve — kunci versi terbaru + APPROVED (transisi tervalidasi).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, businessId, user } = await requireAuth(req);
    const { data: q } = await supabase
      .from('quotes')
      .select('id,status')
      .eq('business_id', businessId)
      .eq('id', params.id)
      .maybeSingle();
    const quote = q as { id: string; status: string } | null;
    if (!quote) return json(404, 'Quotation tidak ditemukan');
    try {
      QuoteMachine.assert(quote.status, 'APPROVED');
    } catch {
      return json(409, `Status ${quote.status} tidak bisa di-approve`);
    }
    const { data: vers } = await supabase
      .from('quote_versions')
      .select('id,version,approved_at')
      .eq('quote_id', quote.id)
      .order('version', { ascending: false })
      .limit(1);
    const latest = (vers ?? [])[0] as { id: string; version: number; approved_at: string | null } | undefined;
    if (!latest) return json(409, 'Belum ada versi quotation');
    const now = new Date().toISOString();
    const { error: lockErr } = await supabase
      .from('quote_versions')
      .update({ approved_at: now, approved_by: user.id })
      .eq('id', latest.id)
      .is('approved_at', null);
    if (lockErr) return json(500, lockErr.message);
    await supabase.from('quote_approvals').insert({
      quote_id: quote.id,
      version_id: latest.id,
      approver_name: user.email ?? 'admin',
      channel: 'admin',
    });
    const { error } = await supabase.from('quotes').update({ status: 'APPROVED' }).eq('id', quote.id);
    if (error) return json(500, error.message);
    return ok({ ok: true, version: latest.version });
  } catch (e) {
    if (e instanceof Response) return e;
    return json(500, 'Gagal approve quotation');
  }
}
