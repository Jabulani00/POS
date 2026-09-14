import { useEffect } from 'react';
import { usePosStore } from '../store/posStore';
import { subscribeOrders } from '../realtime/channel';

/**
 * Mount once at the app root. Hydrates the store, subscribes to cross-tab realtime
 * (Supabase Realtime stand-in), and mirrors the browser's online/offline events into
 * the store so the offline outbox flushes automatically on reconnect.
 */
export function useRealtimeSync(): void {
  const hydrate = usePosStore((s) => s.hydrate);
  const receiveRemote = usePosStore((s) => s.receiveRemote);
  const setOnline = usePosStore((s) => s.setOnline);

  useEffect(() => {
    hydrate();

    const unsub = subscribeOrders((msg) => receiveRemote(msg.orders));

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      unsub();
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [hydrate, receiveRemote, setOnline]);
}
