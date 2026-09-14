// Formatting helpers — South African Rand + time-since for order aging.

const zar = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return zar.format(amount);
}

/** Whole minutes elapsed since an ISO timestamp. */
export function minutesSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 60000);
}

/** Compact "m:ss since ordered" clock for KDS tickets. */
export function elapsedClock(iso: string, now: number = Date.now()): string {
  const totalSec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Order numbers shown big — pad to 3 digits (e.g. #007). */
export function orderLabel(n: number): string {
  return `#${n.toString().padStart(3, '0')}`;
}
