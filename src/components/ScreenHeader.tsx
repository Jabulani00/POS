import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { SyncIndicator } from './SyncIndicator';
import { ConnectivityToggle } from './ConnectivityToggle';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showConnectivity?: boolean;
}

export function ScreenHeader({ title, subtitle, right, showConnectivity = true }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur">
      <Link
        to="/"
        className="tap flex items-center justify-center rounded-xl text-navy hover:bg-navy-50"
        aria-label="Back to home"
      >
        <ArrowLeft size={22} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-lg font-extrabold text-navy">{title}</h1>
          {subtitle && <span className="hidden text-sm text-slate-400 sm:inline">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showConnectivity && <ConnectivityToggle />}
        <SyncIndicator />
        {right}
      </div>
    </header>
  );
}
