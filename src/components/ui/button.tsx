import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary' // black/white inverted
  | 'accent' // sharp yellow — single high-emphasis affordance
  | 'secondary' // bordered
  | 'outline' // bordered
  | 'ghost' // no chrome
  | 'destructive' // red
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 active:opacity-100',
  accent:
    'bg-accent text-accent-foreground hover:opacity-90 active:opacity-100',
  secondary:
    'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/70',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-secondary',
  ghost: 'text-foreground hover:bg-secondary',
  destructive:
    'bg-destructive text-destructive-foreground hover:opacity-90',
  link: 'text-foreground underline-offset-4 hover:underline p-0 h-auto'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
  icon: 'h-8 w-8'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...rest },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';