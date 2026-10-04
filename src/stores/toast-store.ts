import { create } from 'zustand';

/**
 * Toast store — a tiny pub/sub for the `<Toaster />` component.
 *
 * Kept outside TanStack Query because toasts are side-effects of
 * mutations, not state that should be refetched on mount.
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `t${Date.now().toString(36)}_${counter}`;
}

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId();
    const toast: Toast = { id, durationMs: 4_000, ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (toast.durationMs && toast.durationMs > 0) {
      window.setTimeout(() => get().dismiss(id), toast.durationMs);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] })
}));

export function toast(input: Omit<Toast, 'id'>): string {
  return useToasts.getState().push(input);
}