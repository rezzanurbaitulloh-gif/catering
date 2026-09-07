import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
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
  DRAFT: "Draf",
  SENT: "Terkirim",
  VIEWED: "Dilihat",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  NEW: "Baru",
};

export function statusLabel(s: string): string {
  return STATUS_LABEL[s] ?? s;
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex min-h-[28px] items-center rounded-full border border-gold/40 bg-gold-soft px-3 text-xs font-bold uppercase tracking-wider text-gold-deep">
      {statusLabel(status)}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card mx-auto max-w-xl text-center" role="status">
      <p className="font-display text-2xl font-bold">{title}</p>
      <div className="rule-gold mx-auto my-3" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-ink/70">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-gold mt-5 text-sm">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Skeleton({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="container-x py-10" role="status" aria-live="polite" aria-label={label}>
      <div className="h-8 w-2/3 animate-pulse rounded bg-line" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-line" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-brand bg-line/70" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
