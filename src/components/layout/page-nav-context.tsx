import { createContext, useContext, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group?: 'main' | 'debug';
}

interface PageNavContextValue {
  title: string;
  items: NavItem[];
}

const PageNavContext = createContext<PageNavContextValue | null>(null);

export function PageNavProvider({
  title,
  items,
  children
}: PageNavContextValue & { children: ReactNode }) {
  return (
    <PageNavContext.Provider value={{ title, items }}>
      {children}
    </PageNavContext.Provider>
  );
}

export function usePageNav(): PageNavContextValue | null {
  return useContext(PageNavContext);
}
