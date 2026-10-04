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
  align = 'start',
  side = 'top',
  className
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
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
    <div ref={wrapperRef} className="relative w-full">
      <div
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {open && (
        <>
          {/* Backdrop — covers the page so any click outside the
              menu closes it. Z-index sits between the shell and the
              menu itself. */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            ref={menuRef}
            role="menu"
            className={cn(
              'absolute z-50 min-w-[220px] border border-border bg-card text-card-foreground animate-slide-up',
              align === 'end' ? 'right-0' : 'left-0',
              side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
              className
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
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