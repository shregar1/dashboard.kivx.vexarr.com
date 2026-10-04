import { useToasts } from '@/stores/toast-store';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle
} as const;

const variantClasses = {
  info: 'border-border bg-card text-foreground',
  success: 'border-success bg-success text-success-foreground',
  warning: 'border-warning bg-warning text-warning-foreground',
  error: 'border-destructive bg-destructive text-destructive-foreground'
} as const;

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = iconMap[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-[360px] animate-slide-up items-start gap-3 border px-4 py-3',
              variantClasses[t.variant]
            )}
          >
            <Icon className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-xs opacity-80">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}