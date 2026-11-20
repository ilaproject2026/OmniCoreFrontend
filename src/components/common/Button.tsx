import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      icon,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isClickLoading, setIsClickLoading] = useState(false);
    const isBusy = isLoading || isClickLoading;
    const activeLeftIcon = icon || leftIcon;
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f17] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30 focus:ring-blue-500 active:scale-[0.98]',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 active:scale-[0.98]',
      outline:
        'border border-slate-700 hover:border-slate-600 hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-500',
      ghost:
        'hover:bg-slate-800/80 text-slate-400 hover:text-white focus:ring-slate-500',
      danger:
        'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-500/30 focus:ring-red-500',
      success:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/30 focus:ring-emerald-500',
    };

    const sizes = {
      xs: 'text-[11px] px-2 py-1 gap-1',
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2',
    };

    const renderIconNode = (node?: React.ReactNode | React.ComponentType<{ className?: string }>) => {
      if (!node) return null;
      if (React.isValidElement(node)) return node;
      if (
        typeof node === 'function' ||
        (typeof node === 'object' && node !== null && '$$typeof' in (node as any))
      ) {
        const IconComp = node as React.ComponentType<{ className?: string }>;
        return <IconComp className="h-4 w-4" />;
      }
      return null;
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        onClick={async (event) => {
          const result = onClick?.(event) as unknown;
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            setIsClickLoading(true);
            try {
              await result;
            } finally {
              setIsClickLoading(false);
            }
          }
        }}
        {...props}
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          activeLeftIcon && <span className="shrink-0">{renderIconNode(activeLeftIcon)}</span>
        )}
        {children}
        {!isBusy && rightIcon && <span className="shrink-0">{renderIconNode(rightIcon)}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
