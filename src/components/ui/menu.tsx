import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes
} from 'react';
import { cn } from '@/lib/utils';

// ── Menu (popover dropdown) ────────────────────────────────────────────

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
}

export function Menu({
  trigger,
  children,
  align = 'end',
  side = 'top',
  className
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {open && (
        <>
          {/* Click-outside scrim — invisible, doesn't dim the page. */}
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            ref={ref}
            role="menu"
            className={cn(
              'fixed z-50 min-w-[220px] border border-border bg-card text-card-foreground animate-slide-up',
              align === 'end' ? 'right-2' : 'left-2',
              side === 'top' ? 'bottom-12' : 'top-12',
              className
            )}
          >
            {children}
          </div>
        </>
      )}
    </>
  );
}

export function MenuItem({
  className,
  ...rest
}: HTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      {...rest}
    />
  );
}

export function MenuLink({
  className,
  ...rest
}: HTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none',
        className
      )}
      {...rest}
    />
  );
}

export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="h-px bg-border" role="separator" />;
}

// ── Avatar (B/W, monogrammed) ──────────────────────────────────────────

export function Avatar({
  label,
  size = 'md',
  className
}: {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  const sizeClass = {
    sm: 'size-6 text-[10px]',
    md: 'size-8 text-xs',
    lg: 'size-10 text-sm'
  }[size];

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center border border-border bg-secondary font-mono font-semibold uppercase',
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}