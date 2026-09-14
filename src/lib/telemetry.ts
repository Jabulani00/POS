// Lightweight telemetry hook — captures sync failures & key events so nothing fails
// silently in the field (brief §9). In production this writes to a Supabase table;
// here it appends to localStorage and mirrors to the console.
import type { TelemetryEvent } from '../types';
import { STORAGE } from './constants';
import { uuid } from './ids';

function read(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE.telemetry);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

export function logEvent(
  level: TelemetryEvent['level'],
  event: string,
  detail?: string,
): void {
  const entry: TelemetryEvent = {
    id: uuid(),
    at: new Date().toISOString(),
    level,
    event,
    detail,
  };
  try {
    const all = read();
    all.unshift(entry);
    localStorage.setItem(STORAGE.telemetry, JSON.stringify(all.slice(0, 200)));
  } catch {
    /* ignore persistence failure */
  }
  const line = `[telemetry] ${event}${detail ? ` — ${detail}` : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export function readTelemetry(): TelemetryEvent[] {
  return read();
}
