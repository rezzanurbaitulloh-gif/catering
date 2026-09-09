"use client";

import { useEffect, useState } from "react";
import { HeartIcon, ShareIcon } from "@/components/icons";

const KEY = "rn-favorit";

function readFav(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

// Favorit paket tersimpan lokal (real, per perangkat).
export function FavoritButton({ packageId, packageName }: { packageId: string; packageName: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readFav().includes(packageId));
  }, [packageId]);
  function toggle() {
    const cur = readFav();
    const next = cur.includes(packageId) ? cur.filter((x) => x !== packageId) : [...cur, packageId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* abaikan */ }
    setOn(next.includes(packageId));
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `Hapus ${packageName} dari favorit` : `Simpan ${packageName} ke favorit`}
      className={`touch inline-flex flex-1 items-center justify-center gap-2 rounded-brand border px-4 py-2.5 text-sm font-semibold transition-colors ${
        on ? "border-bark bg-gold-soft text-bark-deep" : "border-line bg-white text-ink/70 hover:border-gold"
      }`}
    >
      <HeartIcon filled={on} /> Favorit
    </button>
  );
}

// Bagikan: Web Share API, fallback salin tautan.
export function ShareButton({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      throw new Error("no-share");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setMsg("Tautan disalin ✓");
      } catch {
        setMsg(url);
      }
    }
  }
  return (
    <span className="inline-flex flex-1 flex-col">
      <button
        type="button"
        onClick={share}
        className="touch inline-flex items-center justify-center gap-2 rounded-brand border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink/70 hover:border-gold"
      >
        <ShareIcon /> Bagikan
      </button>
      {msg ? <span className="mt-1 text-xs text-muted" role="status">{msg}</span> : null}
    </span>
  );
}
