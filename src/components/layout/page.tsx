import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 border-b border-border pb-6', className)}>
      {breadcrumbs}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6 p-6', className)}>{children}</div>;
}