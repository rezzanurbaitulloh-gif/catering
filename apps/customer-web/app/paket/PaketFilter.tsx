"use client";

import { useMemo, useState } from "react";
import PackageCard from "@/components/PackageCard";
import { EmptyState } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import type { PackageRow } from "@/lib/types";

const PRICE_BANDS = [
  { label: "Semua harga", max: 0 },
  { label: "< Rp30rb", max: 30000 },
  { label: "Rp30–50rb", max: 50000 },
  { label: "Rp50–100rb", max: 100000 },
] as const;

function matchCategory(p: PackageRow, kat: string): boolean {
  if (!kat) return true;
  const c = CATEGORIES.find((x) => x.label === kat);
  const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
  if (!c) return hay.includes(kat.toLowerCase());
  return c.match.some((m) => hay.includes(m));
}

// Katalog ala marketplace: cari + chip kategori + chip harga.
export default function PaketFilter({ initial, initialKat = "", initialQ = "", initialTanggal = "" }: { initial: PackageRow[]; initialKat?: string; initialQ?: string; initialTanggal?: string }) {
  const cardQuery = initialTanggal ? `?tanggal=${encodeURIComponent(initialTanggal)}` : "";
  const [q, setQ] = useState(initialQ);
  const [kat, setKat] = useState(initialKat);
  const [band, setBand] = useState<number>(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initial.filter((p) => {
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle);
      const matchB = band === 0 || p.base_price_per_pax <= band;
      return matchQ && matchB && matchCategory(p, kat);
    });
  }, [initial, q, kat, band]);

  return (
    <div className="mt-6">
      <form role="search" aria-label="Saring paket" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="cari-paket" className="label">Cari paket</label>
        <input
          id="cari-paket"
          type="search"
          className="field"
          placeholder="cth: pernikahan, nasi box…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </form>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Kategori">
        <button type="button" onClick={() => setKat("")} className={`chip ${kat === "" ? "chip-active" : ""}`} aria-pressed={kat === ""}>
          Semua
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.label} type="button" onClick={() => setKat(kat === c.label ? "" : c.label)} className={`chip ${kat === c.label ? "chip-active" : ""}`} aria-pressed={kat === c.label}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-1 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Rentang harga">
        {PRICE_BANDS.map((b) => (
          <button key={b.label} type="button" onClick={() => setBand(b.max)} className={`chip ${band === b.max ? "chip-active" : ""}`} aria-pressed={band === b.max}>
            {b.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
        {initial.length === 0
          ? "Katalog belum termuat — periksa koneksi lalu muat ulang."
          : `Menampilkan ${filtered.length} dari ${initial.length} paket.`}
      </p>

      {filtered.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <PackageCard key={p.id} pkg={p} query={cardQuery} />
          ))}
        </div>
      ) : initial.length ? (
        <div className="mt-4">
          <EmptyState
            title="Tidak ada paket yang cocok"
            body="Coba kata kunci, kategori, atau rentang harga lain."
          />
        </div>
      ) : null}
    </div>
  );
}
