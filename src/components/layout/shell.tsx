import { Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Toaster } from '@/components/ui/toaster';

export function Shell({ children }: { children?: ReactNode } = {}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children ?? <Outlet />}
        </main>
      </div>
      <Toaster />
    </div>
  );
}