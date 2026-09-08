import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { BUSINESS_ID } from "@/lib/constants";
import { formatIDR, formatTanggalID } from "@/lib/format";
import { createPrivilegedClient } from "@/lib/server-db";
import ApproveForm from "./ApproveForm";
import PayOnlineButton from "@/components/PayOnline";

export const metadata: Metadata = { title: "Tinjau Penawaran" };
export const dynamic = "force-dynamic";

interface Version {
  version: number;
  pax: number;
  items: Array<{ name: string; qty: number; unit_price: number; per_pax?: boolean }>;
  subtotal: number;
  discount: number;
  total: number;
  change_summary: string | null;
  created_at: string;
  approved_at: string | null;
}

// Halaman tinjau & setujui penawaran (premium). Riwayat versi tidak pernah ditimpa.
export default async function PenawaranPage({ params }: { params: { id: string } }) {
  const { client, mode } = createPrivilegedClient();
  if (!client || mode !== "service") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Penawaran daring belum aktif</h1>
        <p className="mt-2 text-sm text-ink/70">
          Konfigurasi server belum lengkap. Silakan hubungi admin via WhatsApp untuk penawaran tertulis.
        </p>
      </div>
    );
  }
  const { data: quote } = await client
    .from("quotes")
    .select("id,quote_no,status,subtotal,discount,total,valid_until")
    .eq("business_id", BUSINESS_ID)
    .eq("id", params.id)
    .maybeSingle();
  if (!quote) notFound();
  const q = quote as { id: string; quote_no: string; status: string; subtotal: number; discount: number; total: number; valid_until: string | null };
  const { data: versions } = await client
    .from("quote_versions")
    .select("version,pax,items,subtotal,discount,total,change_summary,created_at,approved_at")
    .eq("quote_id", q.id)
    .order("version", { ascending: false });
  const list = (versions ?? []) as Version[];
  const latest = list[0] ?? null;
  const canApprove = ["SENT", "VIEWED"].includes(q.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="kicker">Penawaran {q.quote_no}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-bold">Tinjau Penawaran</h1>
        <StatusBadge status={q.status} />
      </div>
      {q.valid_until ? <p className="mt-1 text-sm text-muted">Berlaku hingga {formatTanggalID(q.valid_until)}</p> : null}

      <div className="mt-6 space-y-4">
        {list.map((v) => (
          <article key={v.version} className="rounded-brand border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                Versi {v.version} {v.version === latest?.version ? "· terbaru" : ""}
              </h2>
              {v.approved_at ? <StatusBadge status="APPROVED" /> : null}
            </div>
            <p className="text-sm text-muted">{v.pax} pax · {formatTanggalID(v.created_at)}</p>
            {v.change_summary ? <p className="mt-1 text-sm text-ink/70">{v.change_summary}</p> : null}
            <ul className="mt-2 divide-y divide-line text-sm">
              {v.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3 py-1.5">
                  <span>{it.name}{it.per_pax ? ` × ${v.pax} pax` : ` × ${it.qty}`}</span>
                  <strong>{formatIDR(it.unit_price * it.qty * (it.per_pax ? v.pax : 1))}</strong>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-line pt-2 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><span>{formatIDR(v.subtotal)}</span></p>
              {v.discount ? <p className="flex justify-between"><span>Diskon</span><span>−{formatIDR(v.discount)}</span></p> : null}
              <p className="flex justify-between font-bold"><span>Total</span><span>{formatIDR(v.total)}</span></p>
            </div>
          </article>
        ))}
        {list.length === 0 ? (
          <div className="rounded-brand border border-line bg-white p-4 text-sm">
            <p className="font-bold">Total {formatIDR(q.total)}</p>
            <p className="text-muted">Rincian versi menyusul dari admin.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <ApproveForm
          quoteId={q.id}
          disabled={!canApprove}
          reason={canApprove ? undefined : `Status saat ini ${q.status} — persetujuan via halaman ini hanya untuk penawaran yang dikirim admin.`}
        />
        <div className="rounded-brand border border-line bg-white p-4">
          <p className="mb-2 text-sm font-bold">Bayar DP / pelunasan daring (Midtrans)</p>
          <PayOnlineButton quoteId={q.id} />
        </div>
      </div>
    </div>
  );
}
