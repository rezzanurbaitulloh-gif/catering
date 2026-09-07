# Architecture — Catering OS

## 1. System decomposition

```
                    ┌─────────────────┐      ┌──────────────────┐
                    │  CUSTOMER WEB   │      │    ADMIN WEB     │
                    │  Next.js :3000  │      │  Next.js :3001   │
                    │  public + authed│      │  authed, RLS     │
                    └────────┬────────┘      └────────┬─────────┘
                             │ REST/Realtime │ REST/Realtime
                    ┌────────▼───────────────▼────────┐
                    │   SUPABASE (single backend)     │
                    │  Postgres + Auth + Storage      │
                    │  Realtime (selective channels)  │
                    │  Edge Functions (server truth)  │
                    └────────┬────────────────┬───────┘
                             │                │  REST/Realtime
                    ┌────────▼────────┐ ┌─────▼────────────┐
                    │ ADMIN MOBILE    │ │  STORAGE BUCKETS │
                    │ Flutter APK     │ │  public: gallery │
                    │ offline-first²  │ │  private: evidence│
                    └─────────────────┘ └──────────────────┘
```

² Offline-first (premium): local op-log with idempotency keys, `PENDING_SYNC →
SYNCING → SYNCED / FAILED → RETRY`. Never show server success before confirmation.

## 2. Why Supabase as the only backend

Single source of truth for three clients without a custom server to operate.
Postgres enforces invariants (tenant isolation, immutable approved quotes,
payment integrity, inventory integrity) even if a client is buggy or hostile.
RLS is the authorization boundary; Edge Functions hold server-side financial and
production calculations. Flutter consumes the same REST contract + generated
types — no second architecture.

## 3. Capability gating (Basic → Premium)

`business_capabilities(business_id, capability, enabled)`.
Server exposes `GET /api/capabilities` derived from JWT business membership.
Each UI route declares `requiredCapability`; missing capability → route 404s
(no locked cards, no upsell banners per spec). API/RLS re-checks the same flag.
Full matrix: `packages/config/src/capabilities.ts`.

## 4. Event as the aggregate root

Almost every domain hangs off `events(id, business_id, event_no, status, …)`:
brief, timelines, pax revisions, items, production plans/batches, packing,
transport/setup/service/breakdown tasks, vehicle/equipment/staff assignments,
payments/expenses/refunds, incidents/complaints, evidence, audit.
State machines (lead/quote/booking/event/payment/incident) live in
`packages/business-logic/src/stateMachines.ts` and are mirrored by a Postgres
`assert_transition()` trigger so invalid jumps fail at the DB too.

## 5. Money & quantity never trust the client

Quoting, discount/promotion validation, production requirement
(`required = per_pax × production_qty`), shortage detection, costing and margin
are computed server-side (Edge Function `calc-quote`, `calc-production`,
`record-payment`) and stored with inputs. Clients display; they do not decide.

## 6. Evidence & audit

Photo evidence (kitchen, packing, loading, arrival, setup, incidents) → private
Storage bucket with signed URLs. `audit_logs(actor, action, entity, before,
after, at, meta)` written by triggers on: quote/price/discount change, payment,
refund, pax change, cancellation, status reversal, inventory adjustment,
incident resolution, compensation.

## 7. Realtime — selective

Channels only: `events:business_id` (status), `notifications:user_id`,
`incidents:business_id`, `transport_tasks:event_id`, `payments:event_id`.
No global subscriptions.

## 8. Failure-analysis spine

For every workflow in `docs/workflows/`: what can go wrong → why → prevention
(schema/validation/checklist) → detection (query/risk rule/realtime) →
evidence (photo/timestamp/signature) → owner role → resolution → financial and
customer impact. The risk engine (`packages/business-logic/src/risk.ts`)
evaluates payment/production/inventory/staffing/vehicle/equipment/venue/
timeline/change/incident rules and surfaces HIGH/MED/LOW with neutral language.
