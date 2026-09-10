"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FavoritButton } from "@/components/FavoritShare";
import { EmptyState } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

type Sort = "relevansi" | "murah" | "mahal" | "minpax";

const PRICE_BANDS = [
  { label: "Semua harga", max: 0 },
  { label: "< Rp30rb", max: 30000 },
  { label: "Rp30–50rb", max: 50000 },
  { label: "Rp50–100rb", max: 100000 },
] as const;

const PAX_BANDS = [
  { label: "Semua", min: 0 },
  { label: "50+ pax", min: 50 },
  { label: "100+ pax", min: 100 },
  { label: "200+ pax", min: 200 },
  { label: "500+ pax", min: 500 },
] as const;

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "relevansi", label: "Relevansi" },
  { value: "murah", label: "Termurah" },
  { value: "mahal", label: "Termahal" },
  { value: "minpax", label: "Min. pax terkecil" },
];

function matchCategory(p: PackageRow, kat: string): boolean {
  if (!kat || kat === "Semua") return true;
  const c = CATEGORIES.find((x) => x.label === kat);
  const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
  if (!c) return hay.includes(kat.toLowerCase());
  return c.match.some((m) => hay.includes(m));
}

// Katalog ala marketplace: search pill + tab + sort + sidebar filter + kartu kaya info.
export default function PaketFilter({
  initial,
  initialKat = "",
  initialQ = "",
  initialTanggal = "",
  promos = [],
}: {
  initial: PackageRow[];
  initialKat?: string;
  initialQ?: string;
  initialTanggal?: string;
  promos?: string[];
}) {
  const [q, setQ] = useState(initialQ);
  const [kat, setKat] = useState(initialKat || "Semua");
  const [band, setBand] = useState<number>(0);
  const [paxMin, setPaxMin] = useState<number>(0);
  const [sort, setSort] = useState<Sort>("relevansi");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = initial.filter((p) => {
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle);
      return matchQ && matchCategory(p, kat) && (band === 0 || p.base_price_per_pax <= band) && (paxMin === 0 || p.min_pax >= paxMin);
    });
    const sorted = [...list];
    if (sort === "murah") sorted.sort((a, b) => a.base_price_per_pax - b.base_price_per_pax);
    if (sort === "mahal") sorted.sort((a, b) => b.base_price_per_pax - a.base_price_per_pax);
    if (sort === "minpax") sorted.sort((a, b) => a.min_pax - b.min_pax);
    return sorted;
  }, [initial, q, kat, band, paxMin, sort]);

  function reset() {
    setQ("");
    setKat("Semua");
    setBand(0);
    setPaxMin(0);
    setSort("relevansi");
  }

  const cardQuery = initialTanggal ? `?tanggal=${encodeURIComponent(initialTanggal)}` : "";

  return (
    <div>
      {/* Bilah cari + tombol bulat */}
      <form role="search" aria-label="Cari paket" onSubmit={(e) => e.preventDefault()} className="mx-auto flex max-w-2xl items-center gap-2">
        <input
          id="cari-paket"
          type="search"
          className="field !rounded-full !py-3 shadow-sm"
          placeholder="Cari nama paket, prasmanan, nasi box…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          aria-label="Cari paket"
        />
        <button type="submit" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-bark text-xl text-cream transition-colors hover:bg-bark-deep" aria-label="Cari">
          <span aria-hidden="true">⌕</span>
        </button>
      </form>

      {/* Tab kategori + sort */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Kategori">
          {["Semua", ...CATEGORIES.map((c) => c.label)].map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kat === k}
              onClick={() => setKat(k)}
              className={`touch shrink-0 rounded-full px-4 text-sm font-bold ${kat === k ? "bg-bark text-cream" : "text-ink/60 hover:text-ink"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Urutkan</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="touch rounded-full border border-line bg-white px-4 text-sm font-semibold" aria-label="Urutkan paket">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filter */}
        <aside className="h-fit rounded-brand border border-line bg-white lg:sticky lg:top-24" aria-label="Filter pencarian">
          <div className="flex items-center justify-between rounded-t-brand bg-bark px-4 py-3 text-cream">
            <p className="text-sm font-bold">Filter Pencarian</p>
            <button type="button" onClick={reset} className="touch text-xs font-semibold text-cream/80 underline hover:text-cream">
              Atur Ulang
            </button>
          </div>
          <div className="space-y-5 p-4">
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-muted">Estimasi Harga /pax</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PRICE_BANDS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setBand(b.max)}
                    aria-pressed={band === b.max}
                    className={`touch rounded-xl border px-2 py-2.5 text-[13px] font-semibold ${band === b.max ? "border-bark bg-gold-soft text-bark-deep" : "border-line text-ink/70 hover:border-gold"}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-muted">Minimal Tamu</legend>
              <div className="mt-2 flex flex-col gap-2">
                {PAX_BANDS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setPaxMin(b.min)}
                    aria-pressed={paxMin === b.min}
                    className={`touch rounded-xl border px-3 py-2.5 text-sm font-semibold ${paxMin === b.min ? "border-bark bg-gold-soft text-bark-deep" : "border-line text-ink/70 hover:border-gold"}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </aside>

        {/* Hasil */}
        <div>
          <p className="text-sm text-muted" role="status" aria-live="polite">
            {initial.length === 0
              ? "Katalog belum termuat — periksa koneksi lalu muat ulang."
              : `Menampilkan ${filtered.length} dari ${initial.length} paket.`}
          </p>
          {filtered.length ? (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <li key={p.id} className="food-card flex flex-col">
                  <div className="relative overflow-hidden">
                    <Link href={`/paket/${p.id}${cardQuery}`} aria-label={`Lihat detail ${p.name}`}>
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} loading="lazy" />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center bg-gold-soft font-display text-4xl font-bold text-bark" aria-hidden="true">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                    <span className="absolute left-3 top-3 rounded-full bg-bark-ink/80 px-2.5 py-1 text-[11px] font-bold text-cream backdrop-blur">
                      Min. {p.min_pax} pax
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 p-1.5 shadow">
                      <FavoritButton packageId={p.id} packageName={p.name} compact />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <h3 className="font-display text-lg font-bold leading-snug">
                      <Link href={`/paket/${p.id}${cardQuery}`} className="hover:text-gold-deep">
                        {p.name}
                      </Link>
                    </h3>
                    {p.description ? <p className="line-clamp-2 text-[13px] leading-relaxed text-ink/70">{p.description}</p> : null}
                    <p className="text-xs text-muted">Min. {p.min_pax} pax{p.max_pax ? ` · Maks. ${p.max_pax}` : ""}</p>
                    <p className="font-display text-xl font-bold text-bark-deep">
                      {formatIDR(p.base_price_per_pax)}
                      <span className="font-body text-xs font-normal text-muted"> /pax</span>
                    </p>
                    {promos.length ? (
                      <p className="w-fit rounded-full bg-[#F5B301]/20 px-2.5 py-1 text-[11px] font-bold text-bark-deep">
                        Promo {promos[0]}
                      </p>
                    ) : null}
                    <Link href={`/paket/${p.id}${cardQuery}`} className="btn-gold mt-auto w-full !py-2.5 text-sm">
                      Lihat &amp; Hitung
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : initial.length ? (
            <div className="mt-3">
              <EmptyState title="Tidak ada paket yang cocok" body="Coba kata kunci, kategori, atau rentang lain — atau atur ulang filter." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
