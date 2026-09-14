# ChopChop POS — Phase 1 (MVP) Prototype

A multi-tenant, cloud-ready point-of-sale for small South African fast-food restaurants.
This is the **Phase 1 prototype**: it runs entirely on **seeded dummy data** — no live
payments, no backend to stand up — so the full **order → kitchen → collection** loop can be
demoed, tested, and reviewed before wiring in real Supabase + Yoco (Phase 1.5).

Three coordinated real-time screens share one live order pipeline:

| Screen | Route | Purpose |
|---|---|---|
| **Till** | `/till` | Take orders, pick combos, Cash/Card (simulated), Send to Kitchen |
| **Kitchen Display (KDS)** | `/kitchen` | Dark, glare-reducing ticket wall; progress Pending → Preparing → Ready |
| **Customer Status Board** | `/board` | Glanceable Preparing / Ready-for-collection columns |

> **Non-negotiable priority:** never lose, duplicate, or silently drop an order. Every design
> choice below serves that reliability.

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The app seeds a demo restaurant (menu + ~24 orders) on first
run — zero manual setup. For the full effect, open each screen in its own browser tab: place an
order on the Till and watch it appear on the KDS and flip the Status Board live.

Other scripts:

```bash
npm test         # Vitest — core order-flow coverage (the flow that must never regress)
npm run build    # type-check (tsc -b) + production build
npm run typecheck
```

## How the prototype maps to the target architecture

The brief specifies Supabase (Postgres + Auth + Realtime + RLS), `pg_graphql` reads via urql,
and an IndexedDB offline outbox. To keep Phase 1 runnable with **zero backend**, this prototype
stands those pieces in with browser-local equivalents behind the **same seams**, so the real
services drop in during Phase 1.5 without reshaping the UI:

| Target (production) | Phase 1 prototype stand-in | Swap point |
|---|---|---|
| Supabase Postgres (source of truth) | `localStorage` + seed script | `src/store/posStore.ts`, `src/seed/` |
| Supabase **Realtime** (per-restaurant WS) | `BroadcastChannel` keyed on `restaurant_id` | `src/realtime/channel.ts` |
| `pg_graphql` reads via **urql** | direct reads from the local store | `src/store/posStore.ts` |
| IndexedDB **offline outbox** + sync engine | in-store outbox + simulated sync latency | `posStore.ts` `flushOutbox()` |
| Supabase Auth + **RLS** | single seeded restaurant/tenant | `src/lib/constants.ts` |

Everything else — the data model (`src/types`), Zod validation, idempotency keys, optimistic
UI, error boundaries, telemetry — is production-shaped already.

## Reliability guarantees demonstrated

- **Optimistic UI** — `Send to Kitchen` confirms instantly (big order number); the sync happens
  in the background with a small, non-intrusive sync indicator.
- **Offline-first** — toggle **Simulate offline** on any screen, place orders: they queue in the
  outbox and render as sent. On reconnect they flush in order and mark synced.
- **No duplicates** — every order carries a client-generated **idempotency key**, so a retried
  sync can never double-create it (asserted in tests).
- **Conflict handling** — remote updates reconcile by `updated_at` (last-write-wins), and a
  banner surfaces "an order changed on another device" rather than silently overwriting.
- **No silent failures** — mutations are Zod-validated before queueing; a telemetry log
  (`src/lib/telemetry.ts`) records order events, sync flushes, conflicts, and screen crashes.
- **Isolated screens** — each screen is wrapped in an error boundary so a crash in one can't take
  down the others.

## Project structure

```
src/
  screens/        till · kitchen-display · status-board · HomeHub
  components/     Button, StatusPill, SyncIndicator, ErrorBoundary, ScreenHeader, …
  store/          posStore.ts  (the shared live order pipeline)  + posStore.test.ts
  realtime/       channel.ts   (Supabase Realtime stand-in)
  schemas/        order.ts      (Zod mutation validation)
  seed/           menu.ts, seed.ts  (dummy data)
  lib/            format, ids, telemetry, constants
  hooks/          useRealtimeSync, useNow
  types/          shared domain model (mirrors the SQL schema)
```

## Tech stack

React 18 · Vite · **TypeScript (strict, no `any` on the order path)** · Tailwind CSS ·
Zustand (shared store) · Zod (validation) · React Router · lucide-react (icons) ·
Vitest + Testing Library.

## What's next (Phase 1.5+)

Wire in the real Supabase backend at the swap points above (RLS-enforced multi-tenancy,
`pg_graphql` reads via urql, Supabase Realtime, an IndexedDB-backed outbox, Vite PWA service
worker), then real **Yoco** card-machine payments, a self-service kiosk screen, and the owner
reporting dashboard.
"# POS" 
