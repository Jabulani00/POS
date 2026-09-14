import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePosStore, cartTotal } from './posStore';
import type { CartLine, MenuItem } from '../types';
import { demoMenu, demoStaff } from '../seed/menu';

const burger = demoMenu.find((m) => m.id === 'm-burger-classic') as MenuItem;
const comboItem = demoMenu.find((m) => m.id === 'm-burger-combo') as MenuItem;

function makeCart(): CartLine[] {
  return [
    { key: 'k1', menu_item: burger, quantity: 2, selected_options: [] },
    {
      key: 'k2',
      menu_item: comboItem,
      quantity: 1,
      selected_options: [
        { option_name: 'Choose your side', choice_label: 'Onion Rings', price_delta: 8 },
        { option_name: 'Choose your drink', choice_label: 'Coke', price_delta: 0 },
      ],
    },
  ];
}

beforeEach(() => {
  localStorage.clear();
  // Reset the singleton store to a known state with menu + staff loaded.
  usePosStore.setState({
    restaurant: null,
    staff: demoStaff,
    menu: demoMenu,
    orders: [],
    outbox: [],
    online: true,
    syncing: false,
    conflictBanner: null,
    activeCashierId: 'staff-cashier',
  });
});

describe('cartTotal', () => {
  it('sums base prices plus option deltas across quantities', () => {
    // 2 × 49.90 + 1 × (79.90 + 8) = 99.80 + 87.90 = 187.70
    expect(cartTotal(makeCart())).toBeCloseTo(187.7, 2);
  });
});

describe('order flow: Till → KDS → Status Board', () => {
  it('places a valid order that appears as an active KDS ticket', () => {
    const order = usePosStore.getState().placeOrder({
      cart: makeCart(),
      payment_method: 'card',
    });

    expect(order).not.toBeNull();
    expect(order!.order_number).toBe(1);
    expect(order!.status).toBe('pending');
    expect(order!.items).toHaveLength(2);
    expect(order!.synced).toBe(false); // optimistic, queued in outbox

    const state = usePosStore.getState();
    expect(state.outbox).toContain(order!.id);

    // KDS shows pending/preparing/ready tickets.
    const kdsTickets = state.orders.filter((o) =>
      ['pending', 'preparing', 'ready'].includes(o.status),
    );
    expect(kdsTickets.map((o) => o.id)).toContain(order!.id);
  });

  it('progresses Pending → Preparing → Ready and lands on the Status Board', () => {
    const order = usePosStore.getState().placeOrder({
      cart: makeCart(),
      payment_method: 'cash',
    })!;

    usePosStore.getState().advanceTicket(order.id);
    expect(usePosStore.getState().orders.find((o) => o.id === order.id)!.status).toBe('preparing');

    usePosStore.getState().advanceTicket(order.id);
    const ready = usePosStore.getState().orders.find((o) => o.id === order.id)!;
    expect(ready.status).toBe('ready');
    expect(ready.items.every((it) => it.kitchen_status === 'ready')).toBe(true);

    // Status Board "Ready for Collection" column.
    const readyColumn = usePosStore.getState().orders.filter((o) => o.status === 'ready');
    expect(readyColumn.map((o) => o.id)).toContain(order.id);
  });

  it('marks an order collected, removing it from active screens', () => {
    const order = usePosStore.getState().placeOrder({
      cart: makeCart(),
      payment_method: 'card',
    })!;
    usePosStore.getState().markCollected(order.id);
    const collected = usePosStore.getState().orders.find((o) => o.id === order.id)!;
    expect(collected.status).toBe('collected');

    const active = usePosStore
      .getState()
      .orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status));
    expect(active.map((o) => o.id)).not.toContain(order.id);
  });

  it('rejects an empty cart', () => {
    const order = usePosStore.getState().placeOrder({ cart: [], payment_method: 'card' });
    expect(order).toBeNull();
    expect(usePosStore.getState().orders).toHaveLength(0);
  });

  it('assigns sequential daily order numbers', () => {
    const a = usePosStore.getState().placeOrder({ cart: makeCart(), payment_method: 'card' })!;
    const b = usePosStore.getState().placeOrder({ cart: makeCart(), payment_method: 'card' })!;
    expect(b.order_number).toBe(a.order_number + 1);
  });
});

describe('offline outbox', () => {
  it('keeps orders queued while offline and does not lose them', () => {
    usePosStore.setState({ online: false });
    const order = usePosStore.getState().placeOrder({ cart: makeCart(), payment_method: 'cash' })!;

    // Still in outbox, still unsynced — but present and renderable (optimistic).
    expect(usePosStore.getState().outbox).toContain(order.id);
    expect(usePosStore.getState().orders.find((o) => o.id === order.id)!.synced).toBe(false);
  });

  it('flushes the outbox on reconnect with no duplicates', () => {
    vi.useFakeTimers();
    usePosStore.setState({ online: false });
    const order = usePosStore.getState().placeOrder({ cart: makeCart(), payment_method: 'cash' })!;

    // Reconnect → setOnline triggers flushOutbox.
    usePosStore.getState().setOnline(true);
    vi.runAllTimers();

    const state = usePosStore.getState();
    expect(state.outbox).toHaveLength(0);
    expect(state.orders.find((o) => o.id === order.id)!.synced).toBe(true);
    // No duplicate created for the same idempotency key.
    const sameKey = state.orders.filter((o) => o.idempotency_key === order.idempotency_key);
    expect(sameKey).toHaveLength(1);
    vi.useRealTimers();
  });
});
