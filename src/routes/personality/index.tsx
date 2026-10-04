import { createRoute, Outlet } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageContent } from '@/components/layout/page';
import { PersonalityPanel } from '@/features/personality-viewer/PersonalityPanel';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'personality',
  component: PersonalityLayout
});

/**
 * Personality layout — the panel uses internal tabs (Overview /
 * Dimensions / Do & Don't), so the layout is a single content
 * frame. The `_authed` parent provides the per-page sidebar nav.
 */
function PersonalityLayout() {
  return (
    <PageContent>
      <PersonalityPanel />
      <Outlet />
    </PageContent>
  );
}