"use client";

import { useMemo, useState } from "react";
import type { MenuItemRow } from "@/lib/types";

// Tab menu dari data menu_items asli (Starter/Utama/Dessert/dll).
export default function MenuTabs({ items }: { items: MenuItemRow[] }) {
  const cats = useMemo(() => {
    const order: string[] = [];
    for (const it of items) {
      if (!order.includes(it.category)) order.push(it.category);
    }
    return order.slice(0, 6);
  }, [items]);
  const [cat, setCat] = useState(cats[0] ?? "");
  if (!items.length) return null;
  const shown = items.filter((it) => it.category === (cat || cats[0]));
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Kategori menu">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`chip shrink-0 ${cat === c ? "chip-active" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.slice(0, 9).map((it) => (
          <li key={it.id} className="flex items-center gap-3 rounded-brand border border-line bg-white p-3">
            {it.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image_url} alt={it.name} loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold-soft font-display text-xl font-bold text-bark-deep" aria-hidden="true">
                {it.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="block text-sm font-bold">{it.name}</span>
              {it.description ? <span className="block text-xs text-muted">{it.description}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
