import { createRoute, Outlet } from '@tanstack/react-router';

import { Route as RootRoute } from '@/routes/__root';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'sessions',
  component: SessionsLayout
});

function SessionsLayout() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Outlet />
    </div>
  );
}