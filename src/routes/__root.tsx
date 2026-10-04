import { createRootRoute } from '@tanstack/react-router';

import { Shell } from '@/components/layout/shell';

// `Shell` already renders the matching child route via its own
// `<Outlet />`, so the root component is a 1:1 pass-through.
export const Route = createRootRoute({
  component: Shell
});