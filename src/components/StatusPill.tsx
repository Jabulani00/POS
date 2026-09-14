import { clsx } from 'clsx';
import { Clock, CookingPot, CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import type { OrderStatus } from '../types';

// Status is always communicated by colour PLUS icon PLUS label — never colour alone
// (accessibility; kitchens are loud/rushed — brief §8).
const config: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; classes: string; dark: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-navy-50 text-navy border-navy-100',
    dark: 'bg-white/10 text-slate-200 border-white/15',
  },
  preparing: {
    label: 'Preparing',
    icon: CookingPot,
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dark: 'bg-warn/20 text-warn border-warn/40',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle2,
    classes: 'bg-green-50 text-ready border-green-200',
    dark: 'bg-ready/20 text-green-300 border-ready/50',
  },
  collected: {
    label: 'Collected',
    icon: PackageCheck,
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dark: 'bg-white/5 text-slate-400 border-white/10',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    classes: 'bg-red-50 text-red-700 border-red-200',
    dark: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
};

interface Props {
  status: OrderStatus;
  theme?: 'light' | 'dark';
  className?: string;
}

export function StatusPill({ status, theme = 'light', className }: Props) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        theme === 'dark' ? c.dark : c.classes,
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.5} aria-hidden />
      {c.label}
    </span>
  );
}
