import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  variant = 'default',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info' }) {
  const variantClasses = {
    default: 'bg-primary/15 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'bg-transparent text-foreground border-border',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    destructive: 'bg-destructive/15 text-destructive border-destructive/30',
    info: 'bg-muted text-muted-foreground border-border'
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...rest}
    />
  );
}