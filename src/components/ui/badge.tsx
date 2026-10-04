import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  variant = 'default',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info';
}) {
  // Flat badges. Inverse variants (default/success/warning/destructive)
  // use the color as background and white-on-color text. Outline + info
  // stay bordered. No tints — clean B/W with semantic status colors.
  const variantClasses = {
    default: 'bg-foreground text-background border-foreground',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'bg-transparent text-foreground border-border',
    success: 'bg-success text-success-foreground border-success',
    warning: 'bg-warning text-warning-foreground border-warning',
    destructive: 'bg-destructive text-destructive-foreground border-destructive',
    info: 'bg-transparent text-muted-foreground border-border'
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        variantClasses[variant],
        className
      )}
      {...rest}
    />
  );
}