// App-wide constants & storage keys.

export const RESTAURANT_ID = 'rest-chopchop-demo';

// localStorage keys (prototype persistence layer standing in for IndexedDB + Supabase).
// Bump the version suffix to force a clean re-seed when the seed shape changes (e.g. v2 adds
// food images to the menu).
export const STORAGE = {
  seeded: 'chopchop:seeded:v2',
  restaurant: 'chopchop:restaurant:v2',
  staff: 'chopchop:staff:v2',
  menu: 'chopchop:menu:v2',
  orders: 'chopchop:orders:v2',
  outbox: 'chopchop:outbox:v2',
  telemetry: 'chopchop:telemetry:v2',
} as const;

/** Cross-tab realtime channel (stands in for Supabase Realtime per-restaurant channel). */
export const REALTIME_CHANNEL = `chopchop:realtime:${RESTAURANT_ID}`;

/** KDS aging threshold in minutes — past this a ticket turns amber (brief §7.2). */
export const AGING_WARN_MINUTES = 8;
export const AGING_LATE_MINUTES = 12;

/** Simulated network latency for the fake sync engine (ms). */
export const SIM_SYNC_LATENCY_MS = 550;
