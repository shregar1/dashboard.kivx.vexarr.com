import { useEffect, useRef, type ReactNode, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

// ── Dialog ─────────────────────────────────────────────────────────────

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be inside <Dialog>');
  return ctx;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Children (DialogContent) mount only when open. Backdrop is also
  // conditional — closed dialogs leave nothing in the DOM. The portal
  // hoists the modal out of any stacking-context trap (the Shell uses
  // `overflow-hidden` which creates a new context, so a non-portaled
  // fixed-position dialog can be silently clipped or non-clickable).
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {open &&
        createPortal(
          <>
            {children}
            <DialogBackdrop onDismiss={() => onOpenChange(false)} />
          </>,
          document.body
        )}
    </DialogContext.Provider>
  );
}

function DialogBackdrop({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 animate-fade-in"
      onClick={onDismiss}
      aria-hidden
    />
  );
}

export function DialogContent({
  children,
  className,
  size = 'md'
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const ctx = useDialog();
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = ctx.open;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx.setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, ctx.setOpen]);

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          'relative w-full border border-border bg-card text-card-foreground animate-slide-up focus:outline-none',
          sizeClass,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-border p-4', className)}>
      <div className="flex-1">{children}</div>
      <DialogCloseButton />
    </div>
  );
}

export function DialogCloseButton() {
  const ctx = useDialog();
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={() => ctx.setOpen(false)}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-base font-semibold tracking-tight', className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)}>{children}</p>;
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t border-border p-4', className)}>
      {children}
    </div>
  );
}

// ── AlertDialog — confirm-style modal ─────────────────────────────────

export interface ConfirmProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  loading?: boolean;
}

export function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sheet — right-side drawer for details panels ───────────────────────

export interface SheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null;
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      <div className="fixed inset-0 z-50 flex justify-end">
        <DialogBackdrop onDismiss={() => onOpenChange(false)} />
        <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card text-card-foreground animate-slide-up">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function SheetClose({ onClose }: { onClose?: () => void }) {
  const ctx = useDialog();
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={() => {
        ctx.setOpen(false);
        onClose?.();
      }}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}