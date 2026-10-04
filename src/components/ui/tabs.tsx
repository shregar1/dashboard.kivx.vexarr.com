import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

import { createContext, useContext } from 'react';
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be inside <Tabs>');
  return ctx;
}

export interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex h-8 items-center border border-border', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useTabsCtx();
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex h-full items-center justify-center px-3 text-xs font-medium uppercase tracking-wider transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useTabsCtx();
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('animate-fade-in', className)}>{children}</div>;
}