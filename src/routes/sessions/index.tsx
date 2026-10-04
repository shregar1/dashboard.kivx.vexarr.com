import { createRoute } from '@tanstack/react-router';

import { Route as SessionsRoute } from '@/routes/sessions/route';
import { SessionsBrowserPanel } from '@/features/sessions-browser/SessionsBrowserPanel';
import { PageHeader } from '@/components/layout/page';

export const Route = createRoute({
  getParentRoute: () => SessionsRoute,
  path: '/',
  component: SessionsIndexPage
});

function SessionsIndexPage() {
  return (
    <>
      <PageHeader
        title="Sessions"
        description="Browse, search, export, and delete recorded sessions."
      />
      <SessionsBrowserPanel />
    </>
  );
}