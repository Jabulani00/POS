import { AlertTriangle, X } from 'lucide-react';
import { usePosStore } from '../store/posStore';

// Surfaces reconciliation conflicts instead of silently overwriting (brief §6.4).
export function ConflictBanner() {
  const message = usePosStore((s) => s.conflictBanner);
  const clear = usePosStore((s) => s.clearConflictBanner);
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-warn px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-md">
      <AlertTriangle size={18} />
      <span>{message}</span>
      <button onClick={clear} className="tap ml-2 rounded-full p-1 hover:bg-black/10" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
