import { Minus, Plus, Trash2, Banknote, CreditCard, Send } from 'lucide-react';
import type { CartLine, PaymentMethod } from '../../types';
import { Button } from '../../components/Button';
import { formatMoney } from '../../lib/format';
import { lineUnitPrice } from './cart';

interface Props {
  cart: CartLine[];
  total: number;
  paymentMethod: PaymentMethod;
  onSetPayment: (m: PaymentMethod) => void;
  onQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  onSend: () => void;
  sending: boolean;
}

export function CartPanel({
  cart,
  total,
  paymentMethod,
  onSetPayment,
  onQty,
  onRemove,
  onSend,
  sending,
}: Props) {
  const empty = cart.length === 0;
  return (
    <div className="flex h-full flex-col">
      <h2 className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Current order
      </h2>

      <div className="flex-1 overflow-y-auto px-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
            <div className="text-4xl">🛒</div>
            <p className="text-sm">Tap menu items to build the order</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <li key={line.key} className="rounded-2xl border border-navy-100 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-lg">
                      {line.menu_item.emoji}
                    </span>
                    <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{line.menu_item.name}</p>
                    {line.selected_options.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {line.selected_options.map((o) => o.choice_label).join(' · ')}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatMoney(lineUnitPrice(line))} each
                    </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">
                      {formatMoney(lineUnitPrice(line) * line.quantity)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQty(line.key, -1)}
                      className="tap flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy hover:bg-navy-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-bold text-navy">{line.quantity}</span>
                    <button
                      onClick={() => onQty(line.key, 1)}
                      className="tap flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy hover:bg-navy-50"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(line.key)}
                    className="tap flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-navy-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">Total</span>
          <span className="text-2xl font-extrabold text-navy">{formatMoney(total)}</span>
        </div>

        {/* Payment method — Phase 1 simulated (real Yoco in 1.5) */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(['cash', 'card'] as const).map((m) => {
            const active = paymentMethod === m;
            const Icon = m === 'cash' ? Banknote : CreditCard;
            return (
              <button
                key={m}
                onClick={() => onSetPayment(m)}
                className={`tap flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 font-semibold capitalize transition ${
                  active ? 'border-navy bg-navy text-white' : 'border-navy-100 text-navy hover:bg-navy-50'
                }`}
              >
                <Icon size={18} /> {m}
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={empty || sending}
          onClick={onSend}
        >
          <Send size={20} /> {sending ? 'Sending…' : 'Send to Kitchen'}
        </Button>
      </div>
    </div>
  );
}
