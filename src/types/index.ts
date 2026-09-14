// ChopChop POS — shared domain types (mirrors the Phase 1 SQL data model, brief §4).
// TypeScript strict mode; no `any` anywhere on the order/payment path (brief §9).

export type Role = 'owner' | 'cashier' | 'kitchen';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled';

export type KitchenStatus = 'pending' | 'preparing' | 'ready';

export type PaymentMethod = 'cash' | 'card';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type MenuCategory = 'Burgers' | 'Chicken' | 'Sides' | 'Drinks';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Staff {
  id: string;
  restaurant_id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface ComboOption {
  id: string;
  menu_item_id: string;
  option_name: string; // e.g. "Choose your side"
  choice_label: string; // e.g. "Chips"
  price_delta: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: MenuCategory;
  is_combo: boolean;
  is_available: boolean;
  sort_order: number;
  /** Food photo URL (falls back to `emoji` tile if missing or it fails to load). */
  image_url: string | null;
  /** Offline-safe emoji used in the image fallback and on KDS/cart rows. */
  emoji: string;
  // nested combo options (single GraphQL round-trip in the real backend, brief §5)
  combo_options: ComboOption[];
}

export interface SelectedOption {
  option_name: string;
  choice_label: string;
  price_delta: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string; // denormalised snapshot at time of order
  quantity: number;
  unit_price: number;
  selected_options: SelectedOption[];
  kitchen_status: KitchenStatus;
}

export interface Order {
  id: string;
  /** Client-generated UUID — idempotency key so retried syncs never double-create (brief §6, §9). */
  idempotency_key: string;
  restaurant_id: string;
  order_number: number; // daily-reset, short human-friendly number
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  total: number;
  cashier_id: string | null;
  cashier_name: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  /** Prototype sync flag: false while queued in the offline outbox, true once "synced". */
  synced: boolean;
}

// ---- Till cart (client-only, pre-order) ----

export interface CartLine {
  key: string; // stable line key = menu_item.id + serialized options
  menu_item: MenuItem;
  quantity: number;
  selected_options: SelectedOption[];
}

// ---- Telemetry (brief §9: capture sync failures instead of failing silently) ----

export interface TelemetryEvent {
  id: string;
  at: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  detail?: string;
}
