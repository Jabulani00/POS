// Zod validation on every mutation payload before it is queued/synced (brief §9).
import { z } from 'zod';

export const selectedOptionSchema = z.object({
  option_name: z.string().min(1),
  choice_label: z.string().min(1),
  price_delta: z.number(),
});

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  menu_item_id: z.string().min(1),
  item_name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  selected_options: z.array(selectedOptionSchema),
  kitchen_status: z.enum(['pending', 'preparing', 'ready']),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
  restaurant_id: z.string().min(1),
  order_number: z.number().int().positive(),
  status: z.enum(['pending', 'preparing', 'ready', 'collected', 'cancelled']),
  payment_method: z.enum(['cash', 'card']).nullable(),
  payment_status: z.enum(['unpaid', 'paid', 'refunded']),
  total: z.number().nonnegative(),
  cashier_id: z.string().nullable(),
  cashier_name: z.string().min(1),
  items: z.array(orderItemSchema).min(1, 'An order must have at least one item'),
  created_at: z.string(),
  updated_at: z.string(),
  synced: z.boolean(),
});

export type ValidatedOrder = z.infer<typeof orderSchema>;
