import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logEvent } from '../lib/telemetry';

interface Props {
  screen: string;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// Error boundary around each screen so a crash in one doesn't take down the others (brief §9).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logEvent('error', `screen_crash:${this.props.screen}`, `${error.message} ${info.componentStack ?? ''}`);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">😵</div>
          <h2 className="text-xl font-bold text-navy">The {this.props.screen} screen hit a snag</h2>
          <p className="max-w-md text-sm text-slate-600">
            This screen has been isolated so the rest of the system keeps running. The error was
            logged to telemetry.
          </p>
          <pre className="max-w-md overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-red-700">
            {this.state.error.message}
          </pre>
          <button
            className="tap rounded-xl bg-brand-orange px-5 py-2.5 font-semibold text-white"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
