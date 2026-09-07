"use client";

import { useMemo, useState } from "react";
import PackageCard from "@/components/PackageCard";
import { EmptyState } from "@/components/ui";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

export default function PaketFilter({ initial }: { initial: PackageRow[] }) {
  const [q, setQ] = useState("");
  const [budget, setBudget] = useState<number | "">("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initial.filter((p) => {
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle);
      const matchB = budget === "" || p.base_price_per_pax <= budget;
      return matchQ && matchB;
    });
  }, [initial, q, budget]);

  return (
    <div className="mt-6">
      <form
        role="search"
        aria-label="Saring paket"
        className="card grid gap-3 sm:grid-cols-[1fr_220px]"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
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
        </div>
        <div>
          <label htmlFor="budget" className="label">Harga maks /pax (Rp)</label>
          <input
            id="budget"
            type="number"
            inputMode="numeric"
            min={0}
            className="field"
            placeholder="cth: 50000"
            value={budget}
            onChange={(e) => setBudget(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      </form>

      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">
        {initial.length === 0
          ? "Katalog belum termuat — periksa koneksi lalu muat ulang."
          : `Menampilkan ${filtered.length} dari ${initial.length} paket.`}
        {budget !== "" && budget > 0 ? ` Batas: ${formatIDR(budget)}/pax.` : ""}
      </p>

      {filtered.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      ) : initial.length ? (
        <div className="mt-4">
          <EmptyState
            title="Tidak ada paket yang cocok"
            body="Coba kata kunci lain atau naikkan batas harga per pax."
          />
        </div>
      ) : null}
    </div>
  );
}
