import { createRoute, Outlet } from '@tanstack/react-router';

import { Route as RootRoute } from '@/routes/__root';
import { PageContent } from '@/components/layout/page';

/**
 * Settings layout — the per-page sidebar in the shell already lists
 * the Settings sub-sections, so this layout is just a content frame.
 */
export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'settings',
  component: SettingsLayout
});

function SettingsLayout() {
  return (
    <PageContent>
      <Outlet />
    </PageContent>
  );
}