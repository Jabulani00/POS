import type { CartLine, MenuItem, SelectedOption } from '../../types';

/** Stable key so identical item+option combinations stack instead of duplicating. */
export function lineKey(menuItem: MenuItem, options: SelectedOption[]): string {
  const opt = [...options]
    .map((o) => `${o.option_name}:${o.choice_label}`)
    .sort()
    .join('|');
  return `${menuItem.id}::${opt}`;
}

export function addToCart(
  cart: CartLine[],
  menuItem: MenuItem,
  options: SelectedOption[],
): CartLine[] {
  const key = lineKey(menuItem, options);
  const existing = cart.find((l) => l.key === key);
  if (existing) {
    return cart.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
  }
  return [...cart, { key, menu_item: menuItem, quantity: 1, selected_options: options }];
}

export function changeQty(cart: CartLine[], key: string, delta: number): CartLine[] {
  return cart
    .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
    .filter((l) => l.quantity > 0);
}

export function removeLine(cart: CartLine[], key: string): CartLine[] {
  return cart.filter((l) => l.key !== key);
}

export function lineUnitPrice(line: CartLine): number {
  return line.menu_item.price + line.selected_options.reduce((s, o) => s + o.price_delta, 0);
}
