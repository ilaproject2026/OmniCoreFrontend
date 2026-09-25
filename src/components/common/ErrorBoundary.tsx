import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error captured by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/auth/login';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message || 'An unexpected rendering error occurred.';

      return (
        <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-5">
              <AlertOctagon className="h-7 w-7 text-red-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 mb-3">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Application Error Caught</span>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">
              Something went wrong
            </h1>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              OmniCore caught an unexpected interface exception. Your workspace session is preserved.
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left">
              <p className="font-mono text-[11px] text-red-300 break-words line-clamp-3">
                {errorMessage}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={this.handleReload}
                className="w-full text-xs"
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Reload Page
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReset}
                className="w-full text-xs"
                leftIcon={<Home className="h-3.5 w-3.5" />}
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
