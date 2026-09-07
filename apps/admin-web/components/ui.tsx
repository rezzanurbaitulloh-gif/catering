import Link from 'next/link';

// Warna pill disalin dari packages/design-tokens/tokens.json → color/status (vendored).
const STATUS_COLORS: Record<string, string> = {
  PLANNING: '#78716C',
  LOCKED: '#1D4ED8',
  IN_PREPARATION: '#B45309',
  IN_TRANSIT: '#7C3AED',
  SETUP: '#C2410C',
  SERVICE: '#15803D',
  BREAKDOWN: '#0E7490',
  COMPLETED: '#3F6212',
  CLOSED: '#44403C',
  HIGH: '#B91C1C',
  MEDIUM: '#B45309',
  LOW: '#15803D',
  CRITICAL: '#7F1D1D',
  NEW: '#78716C',
  CONTACTED: '#1D4ED8',
  QUALIFIED: '#0E7490',
  QUOTED: '#B45309',
  BOOKED: '#15803D',
  CONVERTED: '#15803D',
  DROPPED: '#B91C1C',
  LOST: '#B91C1C',
  DRAFT: '#78716C',
  SENT: '#1D4ED8',
  VIEWED: '#0E7490',
  REVISION_REQUESTED: '#B45309',
  APPROVED: '#15803D',
  REJECTED: '#B91C1C',
  EXPIRED: '#44403C',
  PENDING: '#B45309',
  PARTIAL: '#C2410C',
  PAID: '#15803D',
  FAILED: '#B91C1C',
  REFUNDED: '#7C3AED',
  UNPAID: '#B91C1C',
  DP: '#B45309',
  OVERPAID: '#7C3AED',
  OPEN: '#B91C1C',
  INVESTIGATING: '#B45309',
  ACTION_REQUIRED: '#C2410C',
  RESOLVED: '#15803D',
  PLANNED: '#78716C',
  PREPARING: '#B45309',
  PRODUCING: '#C2410C',
  QC: '#0E7490',
  TENTATIVE: '#B45309',
  CONFIRMED: '#15803D',
  CANCELLED: '#B91C1C',
  READY: '#15803D',
};

export function StatusPill({ status }: { status: string }) {
  const bg = STATUS_COLORS[status] ?? '#78716C';
  return (
    <span className="pill text-white" style={{ background: bg }}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight">{title}</h1>
        {sub ? <p className="muted mt-1">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="h-section">{title}</h2>
      {sub ? <p className="muted mt-0.5 mb-3">{sub}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col gap-2 py-8" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 w-2/3 bg-line rounded" />
          <div className="h-3 w-1/3 bg-line rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export function Empty({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="card text-center py-8">
      <p className="font-semibold">{text}</p>
      {hint ? <p className="muted mt-1">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div className="card text-center py-8 border-danger/40">
      <p className="font-semibold text-danger">Gagal memuat</p>
      <p className="muted mt-1">{text}</p>
      {retry ? (
        <button className="btn-ghost mt-3" onClick={retry}>
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function LoginRequired({ what }: { what: string }) {
  return (
    <div className="card text-center py-8">
      <p className="font-semibold">Login diperlukan</p>
      <p className="muted mt-1">{what} hanya terlihat setelah login (mode demo read-only).</p>
      <Link href="/login" className="btn-gold mt-4">
        Masuk / Login
      </Link>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <p className="font-display text-[26px] leading-tight mt-1">{value}</p>
      {sub ? <p className="muted mt-0.5">{sub}</p> : null}
    </div>
  );
}

/** Tombol aksi kecil yang konsisten; sembunyikan (jangan render) bila tak ada aksi nyata. */
export function Act({
  onClick,
  children,
  tone = 'ghost',
  disabled,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'ghost' | 'primary' | 'gold' | 'danger';
  disabled?: boolean;
  title?: string;
}) {
  const cls = tone === 'primary' ? 'btn-primary' : tone === 'gold' ? 'btn-gold' : tone === 'danger' ? 'btn-danger' : 'btn-ghost';
  return (
    <button className={`${cls} !min-h-[40px] !px-3 !text-[14px]`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}
