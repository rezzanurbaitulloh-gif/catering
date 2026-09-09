import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DetailTabs from "./DetailTabs";
import Estimator from "./Estimator";
import { FavoritButton, ShareButton } from "@/components/FavoritShare";
import { BUSINESS_ID } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { PackageAddonRow, PackageItemRow, PackageRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams: { tanggal?: string };
}

async function getDetail(id: string) {
  const sb = createAnonServerClient();
  if (!sb) return null;
  try {
    const { data: pkg, error } = await sb.from("packages").select("*").eq("id", id).eq("business_id", BUSINESS_ID).eq("is_active", true).maybeSingle();
    if (error || !pkg) return null;
    const [itemsRes, addonsRes, testiRes] = await Promise.all([
      sb.from("package_items").select("*").eq("package_id", id),
      sb.from("package_addons").select("*").eq("package_id", id),
      sb.from("testimonials").select("customer_name,rating,message").eq("business_id", BUSINESS_ID).eq("is_published", true).order("rating", { ascending: false }).limit(5),
    ]);
    return {
      pkg: pkg as PackageRow,
      items: ((itemsRes.data ?? []) as PackageItemRow[]),
      addons: ((addonsRes.data ?? []) as PackageAddonRow[]),
      reviews: ((testiRes.data ?? []) as Array<{ customer_name: string; rating: number; message: string }>),
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

// Detail paket ala mockup: foto, kartu info + Pesan/Favorit/Bagikan, tab, ringkasan.
export default async function PaketDetailPage({ params, searchParams }: Props) {
  const detail = await getDetail(params.id);
  if (!detail) notFound();
  const { pkg, items, addons, reviews } = detail;
  const tanggal = searchParams.tanggal ?? "";
  const bookingHref = `/booking?paket=${encodeURIComponent(pkg.id)}${tanggal ? `&tanggal=${encodeURIComponent(tanggal)}` : ""}`;

  return (
    <article className="container-x py-8">
      <nav aria-label="Jejak halaman" className="text-sm text-muted">
        <Link href="/paket" className="underline hover:text-gold-deep">Paket</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{pkg.name}</span>
      </nav>

      {pkg.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pkg.image_url}
          alt={pkg.name}
          className="mt-4 h-64 w-full rounded-brand object-cover sm:h-96"
          loading="eager"
        />
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="kicker">Detail Paket</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{pkg.name}</h1>
          <p className="mt-1 text-sm text-muted">Min. {pkg.min_pax} pax{pkg.max_pax ? ` · Maks. ${pkg.max_pax} pax` : ""}</p>
          <DetailTabs description={pkg.description} items={items} reviews={reviews} />
          {addons.length ? (
            <section aria-labelledby="tambahan" className="mt-6">
              <h2 id="tambahan" className="font-display text-xl font-bold">Tambahan (Add-on)</h2>
              <ul className="mt-3 divide-y divide-line rounded-brand border border-line bg-white">
                {addons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-medium">{a.name}</span>
                    <span className="shrink-0 font-semibold text-bark-deep">
                      {formatIDR(a.price)}{a.per_pax ? " /pax" : " /paket"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="card">
            <p className="font-display text-3xl font-bold text-bark-deep">
              {formatIDR(pkg.base_price_per_pax)}
              <span className="font-body text-sm font-normal text-muted"> /pax</span>
            </p>
            <Link href={bookingHref} className="btn-gold mt-3 w-full">
              Pesan Sekarang
            </Link>
            <div className="mt-2 flex gap-2">
              <FavoritButton packageId={pkg.id} packageName={pkg.name} />
              <ShareButton title={pkg.name} />
            </div>
          </div>
          <div className="mt-4">
            <Estimator pkg={pkg} addons={addons} tanggal={tanggal} />
          </div>
        </div>
      </div>
    </article>
  );
}
