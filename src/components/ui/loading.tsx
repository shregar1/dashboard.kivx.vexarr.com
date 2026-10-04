import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-300ms]" />
      <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-150ms]" />
      <span className="size-1 animate-pulse rounded-full bg-current" />
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent',
        className
      )}
    />
  );
}