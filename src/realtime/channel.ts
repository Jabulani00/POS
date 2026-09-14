// Cross-tab realtime bridge.
//
// In production this is Supabase Realtime (Postgres CDC over WebSocket), subscribed
// per-restaurant (brief §5). In this dummy-data prototype we stand it in with a
// BroadcastChannel keyed on the restaurant id, so the Till / KDS / Status Board tabs
// stay in lock-step live — the exact behaviour the real backend will provide.
import type { Order } from '../types';
import { REALTIME_CHANNEL } from '../lib/constants';

export interface OrdersSyncMessage {
  type: 'orders:sync';
  senderId: string;
  orders: Order[];
}

type Listener = (msg: OrdersSyncMessage) => void;

const senderId = Math.random().toString(36).slice(2);
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(REALTIME_CHANNEL);
  return channel;
}

/** Publish the full order set to all other tabs (like a realtime broadcast). */
export function publishOrders(orders: Order[]): void {
  const ch = getChannel();
  if (!ch) return;
  const msg: OrdersSyncMessage = { type: 'orders:sync', senderId, orders };
  ch.postMessage(msg);
}

/** Subscribe to remote order updates; ignores our own echoes. Returns an unsubscribe fn. */
export function subscribeOrders(listener: Listener): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (ev: MessageEvent<OrdersSyncMessage>) => {
    const data = ev.data;
    if (!data || data.type !== 'orders:sync') return;
    if (data.senderId === senderId) return; // ignore our own broadcast
    listener(data);
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}

export const realtimeSenderId = senderId;
