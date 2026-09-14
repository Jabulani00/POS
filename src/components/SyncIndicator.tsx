import { clsx } from 'clsx';
import { Check, RefreshCw, WifiOff, CloudOff } from 'lucide-react';
import { usePosStore } from '../store/posStore';

// Small, non-intrusive sync-status indicator (brief §3.4). Reflects offline queue depth.
export function SyncIndicator({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const online = usePosStore((s) => s.online);
  const syncing = usePosStore((s) => s.syncing);
  const pending = usePosStore((s) => s.outbox.length);

  let icon = <Check size={14} strokeWidth={3} />;
  let label = 'Synced';
  let tone = theme === 'dark' ? 'text-green-300' : 'text-ready';

  if (!online) {
    icon = <WifiOff size={14} strokeWidth={2.5} />;
    label = pending > 0 ? `Offline · ${pending} queued` : 'Offline';
    tone = theme === 'dark' ? 'text-warn' : 'text-amber-600';
  } else if (syncing) {
    icon = <RefreshCw size={14} strokeWidth={2.5} className="animate-spin" />;
    label = 'Syncing…';
    tone = theme === 'dark' ? 'text-slate-300' : 'text-slate-500';
  } else if (pending > 0) {
    icon = <CloudOff size={14} strokeWidth={2.5} />;
    label = `${pending} queued`;
    tone = theme === 'dark' ? 'text-warn' : 'text-amber-600';
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        theme === 'dark' ? 'bg-white/5' : 'bg-black/5',
        tone,
      )}
      title="Order sync status"
    >
      {icon}
      {label}
    </span>
  );
}
