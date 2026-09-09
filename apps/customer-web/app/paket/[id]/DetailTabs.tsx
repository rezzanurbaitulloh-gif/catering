"use client";

import { useState } from "react";
import type { PackageItemRow } from "@/lib/types";

// Tab Informasi / Menu / Ulasan ala mockup (konten nyata dari DB).
export default function DetailTabs({
  description,
  items,
  reviews,
}: {
  description: string | null;
  items: PackageItemRow[];
  reviews: Array<{ customer_name: string; rating: number; message: string }>;
}) {
  const [tab, setTab] = useState<"info" | "menu" | "ulasan">("info");
  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-line" role="tablist" aria-label="Detail paket">
        {(
          [
            ["info", "Informasi"],
            ["menu", "Menu"],
            ["ulasan", `Ulasan (${reviews.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`touch px-4 text-sm font-bold ${
              tab === key ? "border-b-2 border-bark text-bark-deep" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "info" ? (
        <div className="py-4 text-sm leading-relaxed text-ink/75" role="tabpanel">
          <p className="font-bold text-ink">Informasi Paket</p>
          <p className="mt-1">{description ?? "Detail paket dilengkapi saat konsultasi penawaran."}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Harga transparan per pax, tanpa biaya tersembunyi</li>
            <li>Gratis konsultasi menu &amp; kebutuhan diet tamu</li>
            <li>Peralatan prasmanan &amp; layanan saji termasuk</li>
          </ul>
        </div>
      ) : null}
      {tab === "menu" ? (
        <div className="py-4" role="tabpanel">
          <p className="font-bold">Menu yang Didapatkan</p>
          {items.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex gap-2">
                  <span className="text-leaf" aria-hidden="true">✓</span>
                  <span>{it.name} <span className="text-muted">· {it.qty_per_pax} {it.unit}/pax</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/70">Rincian menu dilengkapi saat konsultasi penawaran.</p>
          )}
        </div>
      ) : null}
      {tab === "ulasan" ? (
        <div className="py-4" role="tabpanel">
          {reviews.length ? (
            <ul className="space-y-3">
              {reviews.map((r, i) => (
                <li key={i} className="rounded-brand border border-line bg-white p-3 text-sm">
                  <p className="font-bold">{r.customer_name} <span className="text-gold">{"★".repeat(r.rating)}</span></p>
                  <p className="mt-1 text-ink/75">“{r.message}”</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/70">Belum ada ulasan — jadilah yang pertama memesan paket ini.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
