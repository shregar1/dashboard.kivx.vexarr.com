import { createRoute, redirect } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';

/**
 * `/settings` itself has no UI — redirect to the first sub-section
 * so the user lands somewhere meaningful when they click "Settings"
 * in the sidebar.
 */
export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/settings/llm' });
  }
});