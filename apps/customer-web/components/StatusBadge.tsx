// Badge status operasional. Warna mengikuti packages/design-tokens/tokens.json.
const MAP: Record<string, string> = {
  PLANNING: "bg-[#78716C]/10 text-[#57534E] border-[#78716C]/30",
  LOCKED: "bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/30",
  IN_PREPARATION: "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30",
  IN_TRANSIT: "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30",
  SETUP: "bg-[#C2410C]/10 text-[#C2410C] border-[#C2410C]/30",
  SERVICE: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30",
  BREAKDOWN: "bg-[#0E7490]/10 text-[#0E7490] border-[#0E7490]/30",
  COMPLETED: "bg-[#3F6212]/10 text-[#3F6212] border-[#3F6212]/30",
  CLOSED: "bg-[#44403C]/10 text-[#44403C] border-[#44403C]/30",
  PENDING: "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30",
  PARTIAL: "bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/30",
  PAID: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30",
  FAILED: "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30",
  REFUNDED: "bg-[#78716C]/10 text-[#57534E] border-[#78716C]/30",
  NEW: "bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/30",
  APPROVED: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30",
  SENT: "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30",
  VIEWED: "bg-[#0E7490]/10 text-[#0E7490] border-[#0E7490]/30",
};

const LABEL: Record<string, string> = {
  PLANNING: "Perencanaan",
  LOCKED: "Terkunci",
  IN_PREPARATION: "Persiapan",
  IN_TRANSIT: "Pengiriman",
  SETUP: "Penataan",
  SERVICE: "Penyajian",
  BREAKDOWN: "Beres-beres",
  COMPLETED: "Selesai",
  CLOSED: "Ditutup",
  PENDING: "Menunggu",
  PARTIAL: "Sebagian",
  PAID: "Lunas",
  FAILED: "Gagal",
  REFUNDED: "Dikembalikan",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = MAP[status] ?? "bg-black/5 text-ink/70 border-line";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${cls}`}
      aria-label={`Status: ${LABEL[status] ?? status}`}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
