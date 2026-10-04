import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Form field wrapper — label + control + optional helper text. */
export function Field({
  label,
  description,
  error,
  children,
  className,
  horizontal
}: {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  horizontal?: boolean;
}) {
  return (
    <div
      className={cn(
        horizontal
          ? 'flex items-center justify-between gap-4 py-3'
          : 'flex flex-col gap-2',
        className
      )}
    >
      <div className={cn(horizontal && 'max-w-md')}>
        {label && <div className="text-sm font-medium leading-none">{label}</div>}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      {horizontal ? <div className="shrink-0">{children}</div> : children}
    </div>
  );
}

/** Section card with title + body rows. Flat B/W with hairline borders. */
export function Section({
  title,
  description,
  children,
  className,
  footer
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn('border border-border bg-card text-card-foreground', className)}>
      {(title || description) && (
        <div className="border-b border-border p-4">
          {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="divide-y divide-border">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 p-3">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Single row inside a Section — `border-b` divider applied by parent. */
export function SectionRow({
  label,
  description,
  children,
  horizontal = true
}: {
  label?: string;
  description?: string;
  children: ReactNode;
  horizontal?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-4 py-3',
        horizontal ? 'flex items-center justify-between gap-6' : 'flex flex-col gap-3'
      )}
    >
      {(label || description) && (
        <div className="max-w-md">
          {label && <div className="text-sm font-medium">{label}</div>}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className={cn(horizontal && 'shrink-0')}>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border p-12 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}