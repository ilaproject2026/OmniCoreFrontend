import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertCircle, RefreshCw, Inbox, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface QueryStateWrapperProps {
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null | unknown;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onRetry?: () => void;
  loadingMessage?: string;
  skeletonCount?: number;
  skeletonHeight?: string;
  children: React.ReactNode;
  className?: string;
}

export const QueryStateWrapper: React.FC<QueryStateWrapperProps> = ({
  isLoading,
  isError = false,
  error,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There is currently no data to display for the selected criteria.',
  emptyAction,
  onRetry,
  loadingMessage = 'Loading data...',
  skeletonCount = 3,
  skeletonHeight = 'h-16',
  children,
  className,
}) => {
  const isNetworkError = Boolean(
    isError &&
      (error instanceof Error
        ? error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('timeout') ||
          error.message.toLowerCase().includes('connection') ||
          error.message.toLowerCase().includes('failed to fetch') ||
          (error as any).code === 'ERR_NETWORK' ||
          (error as any).code === 'NETWORK_ERROR'
        : typeof error === 'object' && error !== null
        ? String((error as any).code || (error as any).message || '').toLowerCase().includes('network')
        : false)
  );

  // Loading State or Backend Inactive State (render skeleton loader)
  if (isLoading || isNetworkError) {
    return (
      <div className={cn('w-full space-y-3', className)}>
        {isNetworkError ? (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span>Connecting to OmniCore backend service... (Live backend inactive)</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-[11px] font-semibold text-blue-400 hover:text-white underline cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-6 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-xs font-medium">{loadingMessage}</span>
          </div>
        )}
        <div className="space-y-2.5">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'w-full rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse',
                skeletonHeight
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error State (non-network specific errors, e.g. 403, 404, 500)
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'An error occurred while fetching data from the server.';

    return (
      <Card className={cn('p-6 border-red-500/30 bg-red-500/5 text-center', className)}>
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">Failed to Load Content</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">{errorMessage}</p>
        {onRetry && (
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="border-red-500/30 hover:bg-red-500/10 text-red-300"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry Connection
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <Card className={cn('p-8 text-center border-dashed border-slate-800 bg-slate-900/30', className)}>
        <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3">
          <Inbox className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">{emptyTitle}</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">{emptyMessage}</p>
        {emptyAction && (
          <div className="mt-4">
            <Button
              size="sm"
              variant="primary"
              onClick={emptyAction.onClick}
              leftIcon={emptyAction.icon}
            >
              {emptyAction.label}
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return <>{children}</>;
};
