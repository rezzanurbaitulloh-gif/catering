import Link from "next/link";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

// Kartu paket ala marketplace kuliner: foto, harga, min pax, CTA cokelat.
export default function PackageCard({ pkg, query = "" }: { pkg: PackageRow; query?: string }) {
  const href = `/paket/${pkg.id}${query}`;
  return (
    <article className="food-card flex flex-col">
      <Link href={href} className="block overflow-hidden" aria-label={`Lihat detail ${pkg.name}`}>
        {pkg.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gold-soft font-display text-4xl font-bold text-bark" aria-hidden="true">
            {pkg.name.charAt(0)}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={href} className="hover:text-gold-deep">
            {pkg.name}
          </Link>
        </h3>
        {pkg.description ? <p className="line-clamp-2 text-sm leading-relaxed text-ink/70">{pkg.description}</p> : null}
        <div className="mt-auto flex items-end justify-between border-t border-line pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Mulai dari</p>
            <p className="font-display text-xl font-bold text-bark-deep">
              {formatIDR(pkg.base_price_per_pax)}
              <span className="font-body text-xs font-normal text-muted"> /pax</span>
            </p>
          </div>
          <p className="text-xs text-muted">Min. {pkg.min_pax} pax</p>
        </div>
        <Link href={href} className="btn-gold w-full !py-2.5 text-sm" aria-label={`Lihat detail ${pkg.name}`}>
          Lihat &amp; Hitung
        </Link>
      </div>
    </article>
  );
}
