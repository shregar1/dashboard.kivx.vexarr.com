import { createRoute, Outlet } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageContent } from '@/components/layout/page';

/**
 * Personality layout — child routes render into `<Outlet />`. The
 * parent `AuthedRoute` provides the per-page sidebar nav with
 * Overview / Dimensions / Do & Don't.
 */
export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'personality',
  component: PersonalityLayout
});

function PersonalityLayout() {
  return (
    <PageContent>
      <Outlet />
    </PageContent>
  );
}