import { createRoute, Outlet, redirect } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageContent } from '@/components/layout/page';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'personality',
  component: PersonalityLayout
});

/**
 * Personality layout — child routes render into `<Outlet />`. The
 * parent `AuthedRoute` provides the per-page sidebar nav with
 * Overview / Dimensions / Do & Don't.
 */
function PersonalityLayout() {
  return (
    <PageContent>
      <Outlet />
    </PageContent>
  );
}

/**
 * `/personality` itself has no UI — redirect to the Overview page so
 * clicking the sidebar item lands somewhere meaningful.
 */
export const IndexRoute = createRoute({
  getParentRoute: () => Route,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/personality/overview' });
  }
});