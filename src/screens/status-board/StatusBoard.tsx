import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowLeft, CookingPot, CheckCircle2 } from 'lucide-react';
import type { Order } from '../../types';
import { usePosStore } from '../../store/posStore';
import { orderLabel } from '../../lib/format';
import { SyncIndicator } from '../../components/SyncIndicator';

function Column({
  title,
  icon,
  orders,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  orders: Order[];
  tone: 'preparing' | 'ready';
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h2
        className={clsx(
          'mb-4 flex items-center justify-center gap-2 rounded-2xl py-3 text-xl font-extrabold uppercase tracking-wide sm:text-2xl',
          tone === 'preparing' ? 'bg-warn/15 text-amber-700' : 'bg-ready/15 text-ready',
        )}
      >
        {icon}
        {title}
      </h2>
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <p className="pt-8 text-center text-slate-300">—</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className={clsx(
                  'animate-pop flex items-center justify-center rounded-2xl py-6 text-center shadow-sm',
                  tone === 'preparing'
                    ? 'bg-white ring-2 ring-warn/40'
                    : 'bg-ready text-white ring-2 ring-ready',
                )}
              >
                <span
                  className={clsx(
                    'text-4xl font-black tabular-nums sm:text-5xl',
                    tone === 'preparing' ? 'text-navy' : 'text-white',
                  )}
                >
                  {orderLabel(o.order_number)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StatusBoard() {
  const orders = usePosStore((s) => s.orders);

  const preparing = orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => a.order_number - b.order_number);
  const ready = orders
    .filter((o) => o.status === 'ready')
    .sort((a, b) => a.order_number - b.order_number);

  return (
    <div className="flex h-screen flex-col bg-offwhite">
      <header className="flex items-center gap-3 border-b border-navy-100 bg-navy px-5 py-4 text-white">
        <Link to="/" className="tap flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10" aria-label="Home">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="flex-1 text-xl font-extrabold sm:text-2xl">
          <span className="text-brand-orange">Chop</span>Chop · Order Status
        </h1>
        <SyncIndicator theme="dark" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 p-5 sm:flex-row">
        <Column
          title="Preparing"
          icon={<CookingPot size={26} />}
          orders={preparing}
          tone="preparing"
        />
        <div className="hidden w-px bg-navy-100 sm:block" />
        <Column
          title="Ready for Collection"
          icon={<CheckCircle2 size={26} />}
          orders={ready}
          tone="ready"
        />
      </div>

      <footer className="border-t border-navy-100 bg-white px-5 py-2 text-center text-xs text-slate-400">
        Updates automatically · ChopChop POS
      </footer>
    </div>
  );
}
