import { EVENT_TYPES, PAX_BANDS } from "@/lib/constants";

// Booking cepat ala A&M: tipe acara + rentang tamu → /booking terisi otomatis.
// Form GET biasa (tanpa JS) — semua parameter dipakai halaman booking.
export default function QuickBook() {
  return (
    <form
      action="/booking"
      method="get"
      className="mt-6 grid max-w-2xl gap-2 rounded-brand bg-white p-2 text-ink shadow-xl sm:grid-cols-[1fr_1fr_auto]"
      aria-label="Booking cepat"
    >
      <label className="block px-3 py-1.5">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">Tipe Acara</span>
        <select name="tipe" className="w-full bg-transparent py-1 text-sm font-semibold outline-none" defaultValue="Pernikahan">
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block border-t border-line px-3 py-1.5 sm:border-l sm:border-t-0">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">Jumlah Tamu</span>
        <select name="pax" className="w-full bg-transparent py-1 text-sm font-semibold outline-none" defaultValue={200}>
          {PAX_BANDS.map((b) => (
            <option key={b.label} value={b.pax}>{b.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-gold shrink-0">
        Pesan Sekarang
      </button>
    </form>
  );
}
