import { useMemo, useState } from 'react';
import { Plus, ShoppingBag, CheckCircle2, X } from 'lucide-react';
import type { CartLine, MenuCategory, MenuItem, PaymentMethod, SelectedOption } from '../../types';
import { usePosStore, cartTotal } from '../../store/posStore';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/Button';
import { formatMoney, orderLabel } from '../../lib/format';
import { addToCart, changeQty, removeLine } from './cart';
import { ComboModal } from './ComboModal';
import { CartPanel } from './CartPanel';
import { FoodImage } from '../../components/FoodImage';

const CATEGORIES: MenuCategory[] = ['Burgers', 'Chicken', 'Sides', 'Drinks'];

export function TillScreen() {
  const menu = usePosStore((s) => s.menu);
  const placeOrder = usePosStore((s) => s.placeOrder);

  const [category, setCategory] = useState<MenuCategory>('Burgers');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [comboItem, setComboItem] = useState<MenuItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState<{ number: number } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const itemCount = cart.reduce((n, l) => n + l.quantity, 0);
  const visibleMenu = menu
    .filter((m) => m.category === category)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = (item: MenuItem) => {
    if (!item.is_available) return;
    if (item.is_combo && item.combo_options.length > 0) {
      setComboItem(item);
    } else {
      setCart((c) => addToCart(c, item, []));
    }
  };

  const handleComboConfirm = (options: SelectedOption[]) => {
    if (comboItem) setCart((c) => addToCart(c, comboItem, options));
    setComboItem(null);
  };

  const handleSend = () => {
    if (cart.length === 0 || sending) return;
    setSending(true);
    // Optimistic: placeOrder returns instantly (order queued + broadcast).
    const order = placeOrder({ cart, payment_method: paymentMethod });
    setSending(false);
    if (!order) {
      alert('That order could not be validated. Please review the items and try again.');
      return;
    }
    setCart([]);
    setCartOpen(false);
    setConfirmed({ number: order.order_number });
    window.setTimeout(() => setConfirmed(null), 2600);
  };

  return (
    <div className="flex h-screen flex-col bg-offwhite">
      <ScreenHeader title="Till" subtitle="Order & Pay" />

      <div className="flex min-h-0 flex-1">
        {/* Menu area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Category chips */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-navy-100 bg-white px-4 py-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`tap whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === c ? 'bg-brand-orange text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto p-4 pb-28 lg:pb-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visibleMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAdd(item)}
                  disabled={!item.is_available}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 border-navy-100 bg-white text-left transition ${
                    item.is_available
                      ? 'hover:border-brand-orange hover:shadow-md active:scale-[.98]'
                      : 'cursor-not-allowed'
                  }`}
                >
                  <div className="relative">
                    <FoodImage
                      src={item.image_url}
                      emoji={item.emoji}
                      alt={item.name}
                      category={item.category}
                      className={`h-24 w-full ${item.is_available ? '' : 'grayscale'}`}
                    />
                    {item.is_combo && (
                      <span className="absolute left-2 top-2 inline-flex rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                        Combo
                      </span>
                    )}
                    {!item.is_available && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-black uppercase tracking-wide text-red-600">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <span className="font-bold leading-tight text-navy">{item.name}</span>
                    {item.description && (
                      <span className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</span>
                    )}
                    <span className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-extrabold text-navy">{formatMoney(item.price)}</span>
                      {item.is_available && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white transition group-hover:scale-110">
                          <Plus size={18} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart — desktop sidebar */}
        <aside className="hidden w-[360px] shrink-0 border-l border-navy-100 bg-offwhite lg:flex lg:flex-col">
          <CartPanel
            cart={cart}
            total={total}
            paymentMethod={paymentMethod}
            onSetPayment={setPaymentMethod}
            onQty={(k, d) => setCart((c) => changeQty(c, k, d))}
            onRemove={(k) => setCart((c) => removeLine(c, k))}
            onSend={handleSend}
            sending={sending}
          />
        </aside>
      </div>

      {/* Cart — mobile sticky bar */}
      {itemCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="tap fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-2xl bg-navy px-5 py-3.5 text-white shadow-xl lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingBag size={20} />
            {itemCount} item{itemCount > 1 ? 's' : ''}
          </span>
          <span className="text-lg font-extrabold">{formatMoney(total)}</span>
        </button>
      )}

      {/* Cart — mobile sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/40 lg:hidden" onClick={() => setCartOpen(false)}>
          <div
            className="mt-auto flex h-[85vh] flex-col rounded-t-3xl bg-offwhite"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Order</span>
              <button onClick={() => setCartOpen(false)} className="tap rounded-full p-1 text-slate-400" aria-label="Close cart">
                <X size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <CartPanel
                cart={cart}
                total={total}
                paymentMethod={paymentMethod}
                onSetPayment={setPaymentMethod}
                onQty={(k, d) => setCart((c) => changeQty(c, k, d))}
                onRemove={(k) => setCart((c) => removeLine(c, k))}
                onSend={handleSend}
                sending={sending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Combo modifier picker */}
      {comboItem && (
        <ComboModal
          item={comboItem}
          onCancel={() => setComboItem(null)}
          onConfirm={handleComboConfirm}
        />
      )}

      {/* Order confirmation — big order number (brief §7.1) */}
      {confirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 p-6 text-center">
          <div className="animate-pop">
            <CheckCircle2 size={72} className="mx-auto text-ready" strokeWidth={2.5} />
            <p className="mt-4 text-lg font-semibold text-white/80">Sent to Kitchen</p>
            <p className="mt-1 text-7xl font-black text-white">{orderLabel(confirmed.number)}</p>
            <Button size="lg" className="mt-8" onClick={() => setConfirmed(null)}>
              Next order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
