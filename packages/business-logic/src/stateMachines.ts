// Validated state transitions — mirrored by Postgres assert_transition() trigger.
// Any transition not listed here MUST be rejected at every layer.

import type {
  LeadStatus, QuoteStatus, BookingStatus, EventStatus, PaymentStatus,
  IncidentStatus, ProductionStatus,
} from '@catering-os/types';

function machine<T extends string>(allowed: Record<T, T[]>) {
  return {
    allowed,
    can(from: T, to: T): boolean {
      return (allowed[from] ?? []).includes(to);
    },
    assert(from: T, to: T): void {
      if (!this.can(from, to)) throw new Error(`Invalid transition ${from} → ${to}`);
    },
  };
}

export const LeadMachine = machine<LeadStatus>({
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CONVERTED', 'LOST'],
  LOST: [],
  CONVERTED: [],
});

export const QuoteMachine = machine<QuoteStatus>({
  DRAFT: ['SENT', 'REJECTED', 'EXPIRED'],
  SENT: ['VIEWED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED'],
  REVISION_REQUESTED: ['DRAFT', 'REJECTED', 'EXPIRED'],
  APPROVED: [],
  REJECTED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
});

export const BookingMachine = machine<BookingStatus>({
  TENTATIVE: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
});

export const EventMachine = machine<EventStatus>({
  PLANNING: ['LOCKED', 'IN_PREPARATION'],
  LOCKED: ['IN_PREPARATION'],
  IN_PREPARATION: ['IN_TRANSIT'],
  IN_TRANSIT: ['SETUP'],
  SETUP: ['SERVICE'],
  SERVICE: ['BREAKDOWN'],
  BREAKDOWN: ['COMPLETED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
});

export const PaymentMachine = machine<PaymentStatus>({
  PENDING: ['PARTIAL', 'PAID', 'FAILED'],
  PARTIAL: ['PAID', 'FAILED', 'REFUNDED'],
  PAID: ['REFUNDED'],
  FAILED: ['PENDING'],
  REFUNDED: [],
});

export const IncidentMachine = machine<IncidentStatus>({
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['ACTION_REQUIRED', 'RESOLVED'],
  ACTION_REQUIRED: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'ACTION_REQUIRED'],
  CLOSED: [],
});

export const ProductionMachine = machine<ProductionStatus>({
  PLANNED: ['PREPARING'],
  PREPARING: ['PRODUCING'],
  PRODUCING: ['QC'],
  QC: ['COMPLETED', 'PRODUCING'],
  COMPLETED: [],
});
