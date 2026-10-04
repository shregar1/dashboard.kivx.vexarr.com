import { createRoute } from '@tanstack/react-router';

import { Route as AuthedRoute } from './_authed';
import { PageContent } from '@/components/layout/page';
import { DashboardHome } from '@/features/dashboard-home/DashboardHome';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: '/',
  component: HomePage
});

function HomePage() {
  return (
    <PageContent>
      <DashboardHome />
    </PageContent>
  );
}