// Helper murni kecil — vendored from packages/* (ditulis ulang lokal agar app self-contained).

/** Format rupiah penuh, cth: 55000 -> "Rp55.000". */
export function formatIDR(n: number | bigint): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  if (!Number.isFinite(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

/** Format tanggal ISO (YYYY-MM-DD / timestamptz) ke Bahasa Indonesia. */
export function formatTanggalID(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00+07:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggalPendek(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Normalisasi nomor HP Indonesia ke format +62…
 * Terima "0812…", "62812…", "+62812…", berikut spasi/tanda strip.
 * Kembalikan null bila tidak valid.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const m = /^(\+62|62|0)8\d{7,12}$/.exec(digits);
  if (!m) return null;
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  return `+62${digits.slice(1)}`;
}

/** Semua varian penulisan satu nomor ternormalisasi (untuk pencocokan DB). */
export function phoneVariants(normalized: string): string[] {
  const rest = normalized.replace(/^\+62/, "");
  return [`+62${rest}`, `62${rest}`, `0${rest}`];
}

/** Tautan chat WhatsApp dengan teks terisi. */
export function waLink(phone: string, text: string): string {
  const num = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
