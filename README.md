# Catering OS

Event Catering Management & Business Operating System.

Product philosophy: **Business Problem → Root Cause → Prevention → Detection → Evidence → Resolution → Feature → Workflow → UI/UX → Database → Notification → Analytics.**

Three apps, one operating system:

| App | Stack | Purpose |
|---|---|---|
| `apps/customer-web` | Next.js + TS, mobile-first | acquisition, packages, inquiry/booking, tracking, payment info, post-event |
| `apps/admin-web` | Next.js + TS, desktop-optimized | business command center (sales → event → production → ops → finance → BI) |
| `apps/admin-mobile` | Flutter (Android-first APK) | field operations: checklists, status, photo evidence, incidents, handover |
| `packages/*` | TS shared truth | types, validation (zod), business-logic (state machines, pricing, risk), api contracts, capabilities, design tokens |
| `supabase/` | Postgres + Auth + Storage + Realtime | schema, RLS, seed, edge functions |

## Capability model

Server-driven. `business_capabilities` gates Basic vs Premium.
UI hiding is NOT security — every privileged operation is re-checked server-side
(RLS + function-level checks). Disabled capability = no route, no nav, no API action.

Basic: orders/booking, packages, events, customers, staff basics, finance basics,
checklists, notifications, incident reporting.

Premium adds: CRM, quotation versioning, change requests, dynamic pricing,
customer accounts, production/BOM, inventory/procurement/suppliers, workforce,
vehicles/equipment, venue/logistics depth, Event Control Center, risk engine,
costing/profitability, analytics/reports/exports, offline sync, QR, digital handover.

## Event lifecycle

```
LEAD → INQUIRY → QUOTATION → REVISION → APPROVAL → BOOKING → DP
→ PLANNING → PAX LOCK → PRODUCTION PLAN → PROCUREMENT → PREPARATION
→ PRODUCTION → QC → PACKING → LOADING → TRANSPORT → ARRIVAL
→ SETUP → SERVICE → BREAKDOWN → EQUIPMENT RECONCILIATION
→ FINAL PAYMENT → FEEDBACK → INCIDENT RESOLUTION → CLOSED
```

Every stage: status, owner role, checklist, timestamps, prerequisites, evidence, exit criteria.
Invalid transitions are rejected (DB trigger + server validation + client guards).

## Quick start

```bash
# 1. env
cp .env.example .env            # fill SUPABASE_URL / ANON / SERVICE_ROLE (never commit .env)
cp apps/customer-web/.env.example apps/customer-web/.env.local
cp apps/admin-web/.env.example apps/admin-web/.env.local

# 2. database
supabase link --project-ref okrnrxqojlugzwsdkczv
supabase db push                # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed/demo.sql

# 3. web
npm install
npm run dev:customer            # :3000
npm run dev:admin               # :3001 (PORT=3001 npm run dev:admin)

# 4. mobile
cd apps/admin-mobile && flutter pub get && flutter run
flutter build apk --release
```

## Docs map

- `docs/architecture/` — system, capability, lifecycle, failure analysis
- `docs/database/` — schema reference, RLS matrix, invariants
- `docs/workflows/` — per-domain workflows (sales → finance)
- `docs/ux/` — mobile-first rules, admin command-center principles
- `docs/demo/` — demo story script + accounts
- `docs/security/` — threat model, RLS policy list, secret handling
- `docs/prd/` — PRD slice per phase

## Definition of done (per feature)

UI + UX coherent + validation + backend + DB + authorization + loading/empty/error/success
states + audit (where required) + realtime (where justified) + mobile behavior +
acceptable a11y + tests for critical logic. No fake buttons, no fake analytics,
no fake payments, no client-side financial truth.
