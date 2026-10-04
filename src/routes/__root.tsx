import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Shell } from '@/components/layout/shell';

export const Route = createRootRoute({
  component: () => (
    <>
      <Shell />
      <Outlet />
    </>
  )
});