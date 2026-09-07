import Link from "next/link";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

export default function PackageCard({ pkg }: { pkg: PackageRow }) {
  return (
    <article className="card flex flex-col gap-3 transition-shadow hover:shadow-md">
      <div>
        <p className="kicker">Paket</p>
        <h3 className="mt-1 font-display text-xl font-bold leading-snug">
          <Link href={`/paket/${pkg.id}`} className="hover:text-gold-deep">
            {pkg.name}
          </Link>
        </h3>
      </div>
      {pkg.description ? <p className="text-sm leading-relaxed text-ink/70">{pkg.description}</p> : null}
      <dl className="mt-auto flex items-end justify-between border-t border-line pt-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Mulai dari</dt>
          <dd className="font-display text-2xl font-bold text-gold-deep">
            {formatIDR(pkg.base_price_per_pax)}
            <span className="font-body text-xs font-normal text-muted"> /pax</span>
          </dd>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Min. {pkg.min_pax} pax</p>
          {pkg.max_pax ? <p>Maks. {pkg.max_pax} pax</p> : null}
        </div>
      </dl>
      <Link href={`/paket/${pkg.id}`} className="btn-outline w-full text-sm" aria-label={`Lihat detail ${pkg.name}`}>
        Lihat Detail &amp; Hitung Estimasi
      </Link>
    </article>
  );
}
