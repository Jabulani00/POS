import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../types';
import { RESTAURANT_ID, STORAGE } from '../lib/constants';
import { uuid } from '../lib/ids';
import { demoMenu, demoRestaurant, demoStaff } from './menu';

// Deterministic-ish pseudo random so demos look consistent-but-varied.
function pick<T>(arr: readonly T[], i: number): T {
  const v = arr[i % arr.length];
  if (v === undefined) throw new Error('pick out of range');
  return v;
}

function buildItem(orderId: string, menuIndex: number, qty: number): OrderItem {
  const mi = pick(demoMenu, menuIndex);
  const selected =
    mi.is_combo && mi.combo_options.length > 0
      ? [
          {
            option_name: mi.combo_options[0]!.option_name,
            choice_label: mi.combo_options[0]!.choice_label,
            price_delta: mi.combo_options[0]!.price_delta,
          },
        ]
      : [];
  return {
    id: uuid(),
    order_id: orderId,
    menu_item_id: mi.id,
    item_name: mi.name,
    quantity: qty,
    unit_price: mi.price,
    selected_options: selected,
    kitchen_status: 'ready',
  };
}

/** Generate ~20 historical orders spread across today and the past week (brief §4). */
function generateHistoricalOrders(): Order[] {
  const orders: Order[] = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // 20 orders over the past 7 days, most already collected.
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(i / 3); // ~3 per day
    const createdMs = now - daysAgo * DAY - (i % 3) * 90 * 60 * 1000 - 3 * 60 * 60 * 1000;
    const id = uuid();
    const itemCount = 1 + (i % 3);
    const items: OrderItem[] = [];
    for (let j = 0; j < itemCount; j++) {
      items.push(buildItem(id, i + j * 4, 1 + ((i + j) % 2)));
    }
    const total = items.reduce(
      (sum, it) =>
        sum +
        it.quantity *
          (it.unit_price + it.selected_options.reduce((s, o) => s + o.price_delta, 0)),
      0,
    );
    const method: PaymentMethod = i % 2 === 0 ? 'card' : 'cash';
    const status: OrderStatus = 'collected';
    const created = new Date(createdMs).toISOString();
    orders.push({
      id,
      idempotency_key: uuid(),
      restaurant_id: RESTAURANT_ID,
      order_number: (i % 40) + 1,
      status,
      payment_method: method,
      payment_status: 'paid',
      total: Math.round(total * 100) / 100,
      cashier_id: 'staff-cashier',
      cashier_name: 'Naledi Dlamini',
      items,
      created_at: created,
      updated_at: new Date(createdMs + 12 * 60 * 1000).toISOString(),
      synced: true,
    });
  }

  // A few LIVE orders from earlier today so the KDS & Status Board aren't empty on first run.
  const live: Array<{ status: OrderStatus; kitchen: OrderItem['kitchen_status']; minsAgo: number; num: number }> = [
    { status: 'preparing', kitchen: 'preparing', minsAgo: 4, num: 41 },
    { status: 'preparing', kitchen: 'pending', minsAgo: 9, num: 42 },
    { status: 'ready', kitchen: 'ready', minsAgo: 6, num: 43 },
    { status: 'pending', kitchen: 'pending', minsAgo: 1, num: 44 },
  ];
  live.forEach((l, idx) => {
    const id = uuid();
    const createdMs = now - l.minsAgo * 60 * 1000;
    const items: OrderItem[] = [
      buildItem(id, idx * 3, 1),
      buildItem(id, idx * 3 + 2, 1),
    ].map((it) => ({ ...it, kitchen_status: l.kitchen }));
    const total = items.reduce(
      (sum, it) =>
        sum +
        it.quantity *
          (it.unit_price + it.selected_options.reduce((s, o) => s + o.price_delta, 0)),
      0,
    );
    orders.push({
      id,
      idempotency_key: uuid(),
      restaurant_id: RESTAURANT_ID,
      order_number: l.num,
      status: l.status,
      payment_method: idx % 2 === 0 ? 'cash' : 'card',
      payment_status: 'paid',
      total: Math.round(total * 100) / 100,
      cashier_id: 'staff-cashier',
      cashier_name: 'Naledi Dlamini',
      items,
      created_at: new Date(createdMs).toISOString(),
      updated_at: new Date(createdMs).toISOString(),
      synced: true,
    });
  });

  return orders;
}

/** Seed dummy data into localStorage once, so the app is demoable with zero setup. */
export function ensureSeeded(): void {
  try {
    if (localStorage.getItem(STORAGE.seeded)) return;
    localStorage.setItem(STORAGE.restaurant, JSON.stringify(demoRestaurant));
    localStorage.setItem(STORAGE.staff, JSON.stringify(demoStaff));
    localStorage.setItem(STORAGE.menu, JSON.stringify(demoMenu));
    localStorage.setItem(STORAGE.orders, JSON.stringify(generateHistoricalOrders()));
    localStorage.setItem(STORAGE.outbox, JSON.stringify([]));
    localStorage.setItem(STORAGE.telemetry, JSON.stringify([]));
    localStorage.setItem(STORAGE.seeded, new Date().toISOString());
  } catch (err) {
    // Non-fatal: app still runs, just without persistence.
    console.error('[seed] failed to seed dummy data', err);
  }
}

/** Wipe all local state and re-seed — wired to a "Reset demo" button. */
export function resetDemo(): void {
  Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
  ensureSeeded();
}
