import { createRootRoute, Outlet } from '@tanstack/react-router';

// The root route is a thin pass-through. Authenticated routes live
// under `routes/_authed.tsx` (which adds the shell), the sign-in
// page is a sibling that renders without it. The router picks the
// right one based on the URL.
export const Route = createRootRoute({
  component: () => <Outlet />
});