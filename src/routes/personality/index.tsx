import { createRoute, redirect } from '@tanstack/react-router';

import { Route as PersonalityRoute } from '@/routes/personality/route';

/**
 * `/personality` itself has no UI — redirect to the Overview page so
 * clicking the sidebar item lands somewhere meaningful.
 */
export const Route = createRoute({
  getParentRoute: () => PersonalityRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/personality/overview' });
  }
});