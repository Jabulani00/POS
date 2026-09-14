import { create } from 'zustand';
import type {
  CartLine,
  MenuItem,
  KitchenStatus,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Restaurant,
  Staff,
} from '../types';
import {
  RESTAURANT_ID,
  SIM_SYNC_LATENCY_MS,
  STORAGE,
} from '../lib/constants';
import { uuid } from '../lib/ids';
import { logEvent } from '../lib/telemetry';
import { orderSchema } from '../schemas/order';
import { demoMenu, demoRestaurant, demoStaff } from '../seed/menu';
import { publishOrders } from '../realtime/channel';

// ---------- persistence helpers ----------

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
  } catch (err) {
    logEvent('error', 'persist_orders_failed', String(err));
  }
}

function writeOutbox(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE.outbox, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

// ---------- domain helpers ----------

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function nextOrderNumber(orders: Order[]): number {
  const todays = orders.filter((o) => isToday(o.created_at));
  const max = todays.reduce((m, o) => Math.max(m, o.order_number), 0);
  return max + 1;
}

/** Derive the order-level status from its items' kitchen statuses. */
function deriveStatus(items: OrderItem[]): Extract<OrderStatus, 'pending' | 'preparing' | 'ready'> {
  if (items.length > 0 && items.every((it) => it.kitchen_status === 'ready')) return 'ready';
  if (items.some((it) => it.kitchen_status !== 'pending')) return 'preparing';
  return 'pending';
}

function lineTotal(line: CartLine): number {
  const opts = line.selected_options.reduce((s, o) => s + o.price_delta, 0);
  return (line.menu_item.price + opts) * line.quantity;
}

export function cartTotal(cart: CartLine[]): number {
  return Math.round(cart.reduce((s, l) => s + lineTotal(l), 0) * 100) / 100;
}

/** Merge remote orders into local by id, last-write-wins on updated_at (brief §6.4). */
function mergeOrders(local: Order[], remote: Order[]): { merged: Order[]; conflicts: number } {
  const byId = new Map<string, Order>();
  for (const o of local) byId.set(o.id, o);
  let conflicts = 0;
  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
    } else if (new Date(r.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
      // remote is newer — it wins, but flag if we had unsynced local edits
      if (!existing.synced) conflicts++;
      byId.set(r.id, r);
    }
  }
  return { merged: Array.from(byId.values()), conflicts };
}

// ---------- store ----------

interface PlaceOrderInput {
  cart: CartLine[];
  payment_method: PaymentMethod;
}

interface PosState {
  restaurant: Restaurant | null;
  staff: Staff[];
  menu: MenuItem[];
  orders: Order[];
  activeCashierId: string;
  /** Simulated connectivity — driven by both the demo toggle and real online/offline events. */
  online: boolean;
  syncing: boolean;
  /** ids of orders sitting in the offline outbox awaiting sync. */
  outbox: string[];
  conflictBanner: string | null;

  hydrate: () => void;
  setOnline: (online: boolean) => void;
  placeOrder: (input: PlaceOrderInput) => Order | null;
  advanceTicket: (orderId: string) => void;
  markCollected: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  receiveRemote: (orders: Order[]) => void;
  flushOutbox: () => void;
  clearConflictBanner: () => void;
}

/** Commit new order state: update store, persist locally, broadcast to other tabs. */
function commit(set: (partial: Partial<PosState>) => void, orders: Order[], outbox: string[]): void {
  writeOrders(orders);
  writeOutbox(outbox);
  set({ orders, outbox });
  publishOrders(orders);
}

export const usePosStore = create<PosState>((set, get) => ({
  restaurant: null,
  staff: [],
  menu: [],
  orders: [],
  activeCashierId: 'staff-cashier',
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  outbox: [],
  conflictBanner: null,

  hydrate: () => {
    set({
      restaurant: readJSON<Restaurant>(STORAGE.restaurant, demoRestaurant),
      staff: readJSON<Staff[]>(STORAGE.staff, demoStaff),
      menu: readJSON<MenuItem[]>(STORAGE.menu, demoMenu),
      orders: readJSON<Order[]>(STORAGE.orders, []),
      outbox: readJSON<string[]>(STORAGE.outbox, []),
    });
  },

  setOnline: (online) => {
    set({ online });
    logEvent('info', 'connectivity_change', online ? 'online' : 'offline');
    if (online) get().flushOutbox();
  },

  placeOrder: ({ cart, payment_method }) => {
    if (cart.length === 0) return null;
    const state = get();
    const orderId = uuid();
    const nowIso = new Date().toISOString();

    const items: OrderItem[] = cart.map((line) => ({
      id: uuid(),
      order_id: orderId,
      menu_item_id: line.menu_item.id,
      item_name: line.menu_item.name,
      quantity: line.quantity,
      unit_price: line.menu_item.price,
      selected_options: line.selected_options,
      kitchen_status: 'pending',
    }));

    const total = cartTotal(cart);
    const cashier = state.staff.find((s) => s.id === state.activeCashierId);

    const order: Order = {
      id: orderId,
      idempotency_key: uuid(), // guarantees retried syncs can't double-create (brief §9)
      restaurant_id: RESTAURANT_ID,
      order_number: nextOrderNumber(state.orders),
      status: 'pending',
      payment_method,
      // Phase 1: payment is dummy/simulated — treat as paid on confirmation.
      payment_status: 'paid',
      total,
      cashier_id: state.activeCashierId,
      cashier_name: cashier?.full_name ?? 'Cashier',
      items,
      created_at: nowIso,
      updated_at: nowIso,
      synced: false, // optimistic — not yet confirmed by "server"
    };

    // Validate before it ever enters the pipeline (brief §9). Reject malformed client-side.
    const parsed = orderSchema.safeParse(order);
    if (!parsed.success) {
      logEvent('error', 'order_validation_failed', parsed.error.message);
      return null;
    }

    // Optimistic write: order + outbox entry, persisted & broadcast immediately.
    const orders = [order, ...state.orders];
    const outbox = [...state.outbox, order.id];
    commit(set, orders, outbox);
    logEvent('info', 'order_placed', `#${order.order_number} (${payment_method})`);

    // Kick the (simulated) sync engine.
    get().flushOutbox();
    return order;
  },

  advanceTicket: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (order.status === 'ready' || order.status === 'collected') return;

    // Cycle the whole ticket: pending -> preparing -> ready.
    const nextKitchen: KitchenStatus = order.status === 'pending' ? 'preparing' : 'ready';
    const items = order.items.map((it) => ({ ...it, kitchen_status: nextKitchen }));
    const updated: Order = {
      ...order,
      items,
      status: deriveStatus(items),
      updated_at: new Date().toISOString(),
    };
    const orders = state.orders.map((o) => (o.id === orderId ? updated : o));
    commit(set, orders, state.outbox);
    logEvent('info', 'ticket_advanced', `#${order.order_number} -> ${updated.status}`);
  },

  markCollected: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const updated: Order = { ...order, status: 'collected', updated_at: new Date().toISOString() };
    const orders = state.orders.map((o) => (o.id === orderId ? updated : o));
    commit(set, orders, state.outbox);
    logEvent('info', 'order_collected', `#${order.order_number}`);
  },

  cancelOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const updated: Order = { ...order, status: 'cancelled', updated_at: new Date().toISOString() };
    const orders = state.orders.map((o) => (o.id === orderId ? updated : o));
    commit(set, orders, state.outbox);
    logEvent('warn', 'order_cancelled', `#${order.order_number}`);
  },

  receiveRemote: (remote) => {
    const state = get();
    const { merged, conflicts } = mergeOrders(state.orders, remote);
    writeOrders(merged);
    set({
      orders: merged,
      conflictBanner:
        conflicts > 0
          ? 'An order changed on another device while you were offline — please check the affected ticket.'
          : state.conflictBanner,
    });
    if (conflicts > 0) logEvent('warn', 'sync_conflict', `${conflicts} order(s) reconciled`);
  },

  flushOutbox: () => {
    const state = get();
    if (state.syncing) return;
    if (!state.online) return; // stay queued until reconnect
    if (state.outbox.length === 0) return;

    set({ syncing: true });
    // Simulate the network round-trip to Supabase. Idempotency key means a retry is safe.
    window.setTimeout(() => {
      const s = get();
      // Mark every queued order as synced. In the real engine this is one upsert per
      // order keyed on idempotency_key, flushed in FIFO order.
      const synced = new Set(s.outbox);
      const orders = s.orders.map((o) =>
        synced.has(o.id) ? { ...o, synced: true } : o,
      );
      writeOrders(orders);
      writeOutbox([]);
      set({ orders, outbox: [], syncing: false });
      publishOrders(orders);
      if (synced.size > 0) logEvent('info', 'outbox_flushed', `${synced.size} order(s) synced`);
    }, SIM_SYNC_LATENCY_MS);
  },

  clearConflictBanner: () => set({ conflictBanner: null }),
}));
