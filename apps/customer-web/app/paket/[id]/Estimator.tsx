"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { writeCart } from "@/lib/cart";
import { formatIDR } from "@/lib/format";
import type { PackageAddonRow, PackageRow } from "@/lib/types";

// Estimasi murni sisi klien (tampilan saja — harga resmi mengikuti penawaran tertulis).
export default function Estimator({ pkg, addons, tanggal = "" }: { pkg: PackageRow; addons: PackageAddonRow[]; tanggal?: string }) {
  const bookingHref = `/booking?paket=${encodeURIComponent(pkg.id)}${tanggal ? `&tanggal=${encodeURIComponent(tanggal)}` : ""}`;
  const [pax, setPax] = useState<number>(pkg.min_pax);
  const [picked, setPicked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const paxValid = Number.isInteger(pax) && pax >= 1;
  const belowMin = paxValid && pax < pkg.min_pax;
  const aboveMax = paxValid && pkg.max_pax != null && pax > pkg.max_pax;

  const { base, addonTotal, grand } = useMemo(() => {
    const p = paxValid ? pax : 0;
    const base = p * pkg.base_price_per_pax;
    const addonTotal = addons
      .filter((a) => picked.includes(a.id))
      .reduce((sum, a) => sum + (a.per_pax ? a.price * p : a.price), 0);
    return { base, addonTotal, grand: base + addonTotal };
  }, [pax, paxValid, picked, addons, pkg.base_price_per_pax]);

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSaved(false);
  }

  // Cart-lite: simpan pilihan ke localStorage untuk diteruskan ke /booking.
  useEffect(() => {
    if (!paxValid) return;
    writeCart({ packageId: pkg.id, packageName: pkg.name, pax, addonIds: picked, updatedAt: new Date().toISOString() });
    setSaved(true);
  }, [pax, paxValid, picked, pkg.id, pkg.name]);

  return (
    <section aria-labelledby="estimasi" className="card">
      <p className="kicker">Ringkasan Pesanan</p>
      <h2 id="estimasi" className="mt-1 font-display text-2xl font-bold">Estimasi Biaya</h2>

      <label htmlFor="pax" className="mt-4 block text-sm font-semibold">
        Jumlah tamu (pax) <span className="font-normal text-muted">· min. {pkg.min_pax}</span>
      </label>
      <input
        id="pax"
        type="number"
        inputMode="numeric"
        min={1}
        max={pkg.max_pax ?? 20000}
        value={Number.isNaN(pax) ? "" : pax}
        onChange={(e) => { setPax(e.target.value === "" ? Number.NaN : Number(e.target.value)); }}
        className="field mt-1.5"
      />
      {!paxValid ? <p className="error-text" role="alert">Masukkan jumlah tamu yang valid.</p> : null}
      {belowMin ? <p className="mt-1 text-sm text-clay" role="note">Di bawah minimal paket — hubungi kami untuk penyesuaian.</p> : null}
      {aboveMax ? <p className="mt-1 text-sm text-clay" role="note">Melebihi maksimal paket — hubungi kami untuk penawaran khusus.</p> : null}

      {addons.length ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Tambahan</legend>
          <ul className="mt-2 space-y-2">
            {addons.map((a) => (
              <li key={a.id}>
                <label className="touch flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm has-[:checked]:border-bark has-[:checked]:bg-gold-soft">
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-[#B45309]"
                    checked={picked.includes(a.id)}
                    onChange={() => toggle(a.id)}
                  />
                  <span className="flex-1">{a.name}</span>
                  <span className="font-semibold text-bark-deep">+{formatIDR(a.price)}{a.per_pax ? "/pax" : ""}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm" aria-live="polite">
        <div className="flex justify-between"><dt className="text-muted">Paket dasar</dt><dd>{formatIDR(base)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Tambahan</dt><dd>{formatIDR(addonTotal)}</dd></div>
        <div className="flex justify-between pt-1 text-base font-bold">
          <dt>Estimasi total</dt><dd className="font-display text-2xl text-bark-deep">{formatIDR(grand)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Estimasi tampilan saja, bukan harga final. Harga resmi mengikuti penawaran tertulis dari tim kami.
      </p>

      <div className="mt-4 grid gap-2">
        <Link
          href={bookingHref}
          className={`btn-gold w-full ${!paxValid ? "pointer-events-none opacity-60" : ""}`}
          aria-disabled={!paxValid}
        >
          Lanjut ke Booking
        </Link>
        {saved && paxValid ? (
          <p className="text-center text-xs text-muted" role="status">✓ Pilihan tersimpan, otomatis terbawa ke formulir.</p>
        ) : null}
      </div>

      {/* CTA lengket bawah khusus layar kecil */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Estimasi</p>
            <p className="font-display text-lg font-bold text-gold-deep">{formatIDR(grand)}</p>
          </div>
          <Link href={bookingHref} className="btn-gold flex-1 !py-3 text-sm">
            Lanjut Booking
          </Link>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </section>
  );
}
