// Vendored dari packages/business-logic/src/stateMachines.ts
// (disalin agar apps/admin-web mandiri — JANGAN import @catering-os/*).
// Aturan ini cerminan trigger Postgres assert_event_transition(); server me-validasi ulang.

function machine<T extends string>(allowed: Record<T, T[]>) {
  return {
    allowed,
    can(from: T, to: T): boolean {
      return (allowed[from] ?? []).includes(to);
    },
    assert(from: T, to: T): void {
      if (!this.can(from, to)) throw new Error(`Transisi tidak valid ${from} → ${to}`);
    },
    next(from: T): T[] {
      return allowed[from] ?? [];
    },
  };
}

export const LeadMachine = machine({
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CONVERTED', 'LOST'],
  LOST: [],
  CONVERTED: [],
} as Record<string, string[]>);

// Status inquiries (kolom inquiries.status) — mesin lokal admin-web.
export const InquiryMachine = machine({
  NEW: ['CONTACTED', 'DROPPED'],
  CONTACTED: ['QUOTED', 'DROPPED'],
  QUOTED: ['BOOKED', 'DROPPED'],
  BOOKED: ['CLOSED'],
  CLOSED: [],
  DROPPED: [],
} as Record<string, string[]>);

export const QuoteMachine = machine({
  DRAFT: ['SENT', 'REJECTED', 'EXPIRED'],
  SENT: ['VIEWED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED'],
  REVISION_REQUESTED: ['DRAFT', 'REJECTED', 'EXPIRED'],
  APPROVED: [],
  REJECTED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
} as Record<string, string[]>);

export const EventMachine = machine({
  PLANNING: ['LOCKED', 'IN_PREPARATION'],
  LOCKED: ['IN_PREPARATION'],
  IN_PREPARATION: ['IN_TRANSIT'],
  IN_TRANSIT: ['SETUP'],
  SETUP: ['SERVICE'],
  SERVICE: ['BREAKDOWN'],
  BREAKDOWN: ['COMPLETED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
} as Record<string, string[]>);

export const PaymentMachine = machine({
  PENDING: ['PARTIAL', 'PAID', 'FAILED'],
  PARTIAL: ['PAID', 'FAILED', 'REFUNDED'],
  PAID: ['REFUNDED'],
  FAILED: ['PENDING'],
  REFUNDED: [],
} as Record<string, string[]>);

export const IncidentMachine = machine({
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['ACTION_REQUIRED', 'RESOLVED'],
  ACTION_REQUIRED: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'ACTION_REQUIRED'],
  CLOSED: [],
} as Record<string, string[]>);

export const ProductionMachine = machine({
  PLANNED: ['PREPARING'],
  PREPARING: ['PRODUCING'],
  PRODUCING: ['QC'],
  QC: ['COMPLETED', 'PRODUCING'],
  COMPLETED: [],
} as Record<string, string[]>);
