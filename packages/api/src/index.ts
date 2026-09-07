// Typed REST contract shared by Next.js apps and Flutter.
// Flutter mirrors these paths + shapes (see apps/admin-mobile/lib/api.dart).

export const API_ROUTES = {
  capabilities: 'GET /api/capabilities',
  inquiries: 'POST /api/inquiries',
  quotes: 'POST /api/quotes',
  quoteApprove: 'POST /api/quotes/:id/approve',
  bookings: 'POST /api/bookings',
  payments: 'POST /api/payments',
  paxLock: 'POST /api/events/:id/pax-lock',
  eventTransition: 'POST /api/events/:id/transition',
  productionTransition: 'POST /api/production/:id/transition',
  incidents: 'POST /api/incidents',
  incidentTransition: 'POST /api/incidents/:id/transition',
  changeRequests: 'POST /api/change-requests',
  risks: 'GET /api/risks',
  profitability: 'GET /api/events/:id/profitability',
  handover: 'POST /api/events/:id/handover',
} as const;

export interface ApiError { error: string; code?: string; details?: unknown; }

export function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}${path}`;
}
