import { Link } from 'react-router-dom';
import { ShoppingCart, ChefHat, MonitorSmartphone, RotateCcw, ExternalLink } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { resetDemo } from '../seed/seed';

const screens = [
  {
    to: '/till',
    title: 'Till',
    subtitle: 'Order & Pay',
    desc: 'Take orders, pick combos, send to the kitchen.',
    icon: ShoppingCart,
    accent: 'bg-brand-orange',
  },
  {
    to: '/kitchen',
    title: 'Kitchen Display',
    subtitle: 'KDS',
    desc: 'Live tickets, progress Pending → Preparing → Ready.',
    icon: ChefHat,
    accent: 'bg-navy',
  },
  {
    to: '/board',
    title: 'Status Board',
    subtitle: 'Customer view',
    desc: 'Preparing / Ready for collection — glanceable.',
    icon: MonitorSmartphone,
    accent: 'bg-ready',
  },
] as const;

export function HomeHub() {
  const restaurant = usePosStore((s) => s.restaurant);
  const orderCount = usePosStore((s) => s.orders.length);

  return (
    <div className="min-h-full bg-offwhite">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-1.5 text-sm font-bold text-white">
            <span className="text-brand-orange">Chop</span>Chop POS
            <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Phase 1 · Demo
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy sm:text-4xl">
            {restaurant?.name ?? 'ChopChop Kasi Grill'}
          </h1>
          <p className="mt-2 text-slate-500">
            One live order pipeline across three screens · {orderCount} orders in demo data
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {screens.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group flex flex-col rounded-3xl border border-navy-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white ${s.accent}`}>
                  <Icon size={24} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {s.subtitle}
                </span>
                <span className="text-xl font-bold text-navy">{s.title}</span>
                <span className="mt-1 flex-1 text-sm text-slate-500">{s.desc}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-orange">
                  Open <ExternalLink size={14} />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-navy-100 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Try the live loop</h2>
          <p className="mt-1 text-sm text-slate-500">
            Open each screen in its own tab (or window). Place an order on the <b>Till</b> — it
            appears instantly on the <b>Kitchen Display</b>; progress it to <b>Ready</b> and watch
            the <b>Status Board</b> flip. Toggle <b>Simulate offline</b> on the Till to see orders
            queue and sync on reconnect — no duplicates, nothing lost.
          </p>
          <button
            onClick={() => {
              if (confirm('Reset all demo data back to the seeded state?')) {
                resetDemo();
                window.location.reload();
              }
            }}
            className="tap mt-4 inline-flex items-center gap-2 rounded-xl border border-navy-100 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy-50"
          >
            <RotateCcw size={16} /> Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
}
