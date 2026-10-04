import { createRoute, Outlet } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
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