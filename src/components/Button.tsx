import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-orange text-white hover:bg-brand-orange-dark active:scale-[.98] shadow-sm',
  secondary:
    'bg-navy text-white hover:bg-navy-700 active:scale-[.98] shadow-sm',
  ghost:
    'bg-transparent text-navy hover:bg-navy-50 border border-navy-100',
  success:
    'bg-ready text-white hover:brightness-95 active:scale-[.98] shadow-sm',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:scale-[.98]',
  dark:
    'bg-charcoal-light text-white border border-charcoal-border hover:brightness-125 active:scale-[.98]',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-2 rounded-lg',
  md: 'text-base px-4 py-2.5 rounded-xl',
  lg: 'text-lg px-6 py-3.5 rounded-2xl font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'tap inline-flex items-center justify-center gap-2 font-medium transition',
        'disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
