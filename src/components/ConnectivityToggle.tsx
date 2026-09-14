import { clsx } from 'clsx';
import { Wifi, WifiOff } from 'lucide-react';
import { usePosStore } from '../store/posStore';

/**
 * Demo-only control to simulate losing connectivity, so the offline-first order queue
 * can be exercised without literally killing the network (brief §6, §11). In production
 * this is driven purely by real online/offline events.
 */
export function ConnectivityToggle({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const online = usePosStore((s) => s.online);
  const setOnline = usePosStore((s) => s.setOnline);

  return (
    <button
      onClick={() => setOnline(!online)}
      className={clsx(
        'tap inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
        online
          ? theme === 'dark'
            ? 'bg-white/5 text-slate-300 hover:bg-white/10'
            : 'bg-navy-50 text-navy hover:bg-navy-100'
          : 'bg-amber-500 text-white hover:brightness-95',
      )}
      title="Simulate connectivity (demo)"
    >
      {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      {online ? 'Simulate offline' : 'Go back online'}
    </button>
  );
}
