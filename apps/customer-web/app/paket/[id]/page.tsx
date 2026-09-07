import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Estimator from "./Estimator";
import { BUSINESS_ID } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { PackageAddonRow, PackageItemRow, PackageRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

async function getDetail(id: string) {
  const sb = createAnonServerClient();
  if (!sb) return null;
  try {
    const { data: pkg, error } = await sb.from("packages").select("*").eq("id", id).eq("business_id", BUSINESS_ID).eq("is_active", true).maybeSingle();
    if (error || !pkg) return null;
    const [itemsRes, addonsRes] = await Promise.all([
      sb.from("package_items").select("*").eq("package_id", id),
      sb.from("package_addons").select("*").eq("package_id", id),
    ]);
    return {
      pkg: pkg as PackageRow,
      items: ((itemsRes.data ?? []) as PackageItemRow[]),
      addons: ((addonsRes.data ?? []) as PackageAddonRow[]),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getDetail(params.id);
  if (!detail) return { title: "Paket tidak ditemukan" };
  return {
    title: detail.pkg.name,
    description: detail.pkg.description ?? `Paket ${detail.pkg.name} — ${formatIDR(detail.pkg.base_price_per_pax)}/pax.`,
  };
}

export default async function PaketDetailPage({ params }: Props) {
  const detail = await getDetail(params.id);
  if (!detail) notFound();
  const { pkg, items, addons } = detail;

  return (
    <article className="container-x py-10">
      <nav aria-label="Jejak halaman" className="text-sm text-muted">
        <Link href="/paket" className="underline hover:text-gold-deep">Paket</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{pkg.name}</span>
      </nav>

      <div className="mt-3 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="kicker">Detail Paket</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight">{pkg.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/75">{pkg.description ?? "—"}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-y border-line py-4 text-sm">
            <div><dt className="text-muted">Harga dasar</dt><dd className="font-display text-2xl font-bold text-gold-deep">{formatIDR(pkg.base_price_per_pax)}<span className="font-body text-xs font-normal text-muted"> /pax</span></dd></div>
            <div><dt className="text-muted">Minimal</dt><dd className="font-bold">{pkg.min_pax} pax</dd></div>
            {pkg.max_pax ? <div><dt className="text-muted">Maksimal</dt><dd className="font-bold">{pkg.max_pax} pax</dd></div> : null}
          </dl>

          <section aria-labelledby="isi-menu" className="mt-8">
            <h2 id="isi-menu" className="font-display text-2xl font-bold">Isi Menu</h2>
            {items.length ? (
              <ul className="mt-3 divide-y divide-line rounded-brand border border-line bg-white">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="font-medium">{it.name}</span>
                    <span className="shrink-0 text-sm text-muted">{it.qty_per_pax} {it.unit}/pax</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="card mt-3 text-sm text-ink/70">Rincian menu paket ini dilengkapi saat konsultasi penawaran.</p>
            )}
          </section>

          {addons.length ? (
            <section aria-labelledby="tambahan" className="mt-8">
              <h2 id="tambahan" className="font-display text-2xl font-bold">Tambahan (Add-on)</h2>
              <ul className="mt-3 divide-y divide-line rounded-brand border border-line bg-white">
                {addons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="font-medium">{a.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-gold-deep">
                      {formatIDR(a.price)}{a.per_pax ? " /pax" : " /paket"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <Estimator pkg={pkg} addons={addons} />
        </div>
      </div>
    </article>
  );
}
