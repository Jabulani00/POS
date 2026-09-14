import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowLeft, ChefHat, Clock, ChevronRight, PackageCheck } from 'lucide-react';
import type { Order } from '../../types';
import { usePosStore } from '../../store/posStore';
import { useNow } from '../../hooks/useNow';
import { SyncIndicator } from '../../components/SyncIndicator';
import { ConnectivityToggle } from '../../components/ConnectivityToggle';
import { AGING_LATE_MINUTES, AGING_WARN_MINUTES } from '../../lib/constants';
import { elapsedClock, minutesSince, orderLabel } from '../../lib/format';

function KitchenTicket({ order, now }: { order: Order; now: number }) {
  const advanceTicket = usePosStore((s) => s.advanceTicket);
  const markCollected = usePosStore((s) => s.markCollected);
  const mins = minutesSince(order.created_at, now);

  const aging =
    order.status === 'ready'
      ? 'ready'
      : mins >= AGING_LATE_MINUTES
        ? 'late'
        : mins >= AGING_WARN_MINUTES
          ? 'warn'
          : 'fresh';

  const border = {
    fresh: 'border-charcoal-border',
    warn: 'border-warn',
    late: 'border-red-500',
    ready: 'border-ready',
  }[aging];

  const clockTone = {
    fresh: 'text-slate-400',
    warn: 'text-warn',
    late: 'text-red-400',
    ready: 'text-green-300',
  }[aging];

  return (
    <div
      className={clsx(
        'animate-slide-in flex flex-col rounded-2xl border-2 bg-charcoal-light p-4 shadow-lg',
        border,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl font-black text-white">{orderLabel(order.order_number)}</span>
        <span className={clsx('flex items-center gap-1.5 font-mono text-lg font-bold', clockTone)}>
          <Clock size={18} />
          {elapsedClock(order.created_at, now)}
        </span>
      </div>

      <ul className="mb-4 flex-1 space-y-2">
        {order.items.map((it) => (
          <li key={it.id} className="border-b border-white/5 pb-2 last:border-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand-orange">{it.quantity}×</span>
              <span className="text-lg font-semibold text-white">{it.item_name}</span>
            </div>
            {it.selected_options.length > 0 && (
              <p className="ml-7 text-sm text-slate-300">
                {it.selected_options.map((o) => `${o.option_name}: ${o.choice_label}`).join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ul>

      {order.status === 'ready' ? (
        <button
          onClick={() => markCollected(order.id)}
          className="tap flex items-center justify-center gap-2 rounded-xl bg-ready py-3 text-lg font-bold text-white transition hover:brightness-110 active:scale-[.98]"
        >
          <PackageCheck size={22} /> Collected
        </button>
      ) : (
        <button
          onClick={() => advanceTicket(order.id)}
          className={clsx(
            'tap flex items-center justify-center gap-2 rounded-xl py-3 text-lg font-bold text-white transition active:scale-[.98]',
            order.status === 'pending'
              ? 'bg-brand-orange hover:bg-brand-orange-dark'
              : 'bg-warn text-navy-900 hover:brightness-105',
          )}
        >
          {order.status === 'pending' ? 'Start Preparing' : 'Mark Ready'}
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}

export function KitchenScreen() {
  const now = useNow(1000);
  const orders = usePosStore((s) => s.orders);

  // Active tickets only: not collected/cancelled. Oldest first (brief §7.2).
  const tickets = orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex h-screen flex-col bg-charcoal text-white">
      <header className="flex items-center gap-3 border-b border-charcoal-border px-4 py-3">
        <Link to="/" className="tap flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/5" aria-label="Home">
          <ArrowLeft size={22} />
        </Link>
        <ChefHat size={24} className="text-brand-orange" />
        <h1 className="flex-1 text-xl font-extrabold">
          Kitchen Display
          <span className="ml-2 text-sm font-medium text-slate-400">{tickets.length} active</span>
        </h1>
        <ConnectivityToggle theme="dark" />
        <SyncIndicator theme="dark" />
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
            <ChefHat size={56} />
            <p className="text-lg">No active tickets — all caught up 🔥</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tickets.map((order) => (
              <KitchenTicket key={order.id} order={order} now={now} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
