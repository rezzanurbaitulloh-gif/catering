import { NextResponse } from "next/server";
import { BUSINESS_ID } from "@/lib/constants";
import { createPrivilegedClient, SERVICE_UNAVAILABLE } from "@/lib/server-db";
import { approveSchema } from "@/lib/validators";

const APPROVABLE = ["SENT", "VIEWED"];

// POST /api/quotes/[id]/approve { approverName } — persetujuan pelanggan.
// Server-side: hanya SENT/VIEWED → APPROVED; versi terbaru dikunci (approved_at).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nama penyetuju belum valid.", details: parsed.error.errors }, { status: 400 });
  }
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 });
  }
  const { data: quote } = await client
    .from("quotes")
    .select("id,status")
    .eq("business_id", BUSINESS_ID)
    .eq("id", params.id)
    .maybeSingle();
  const q = quote as { id: string; status: string } | null;
  if (!q) return NextResponse.json({ error: "Penawaran tidak ditemukan." }, { status: 404 });
  if (!APPROVABLE.includes(q.status)) {
    return NextResponse.json(
      { error: `Penawaran berstatus ${q.status} — tidak dapat disetujui dari sini. Hubungi admin.` },
      { status: 409 }
    );
  }
  const { data: versions } = await client
    .from("quote_versions")
    .select("id,version")
    .eq("quote_id", q.id)
    .order("version", { ascending: false })
    .limit(1);
  const latest = (versions ?? [])[0] as { id: string; version: number } | undefined;

  const now = new Date().toISOString();
  if (latest) {
    await client.from("quote_versions").update({ approved_at: now }).eq("id", latest.id).is("approved_at", null);
    await client.from("quote_approvals").insert({
      quote_id: q.id,
      version_id: latest.id,
      approver_name: parsed.data.approverName,
      channel: "web",
    });
  }
  const { error } = await client.from("quotes").update({ status: "APPROVED" }).eq("id", q.id);
  if (error) return NextResponse.json({ error: "Gagal menyimpan persetujuan." }, { status: 500 });
  return NextResponse.json({ ok: true, version: latest?.version ?? null });
}
