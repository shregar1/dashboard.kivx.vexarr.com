import { createRoute } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageHeader } from '@/components/layout/page';
import { BugReportPanel } from '@/features/diagnostics-panel/BugReportPanel';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'report/bug',
  component: BugReportPage
});

function BugReportPage() {
  return (
    <>
      <PageHeader
        title="Report a bug"
        description="Send a snapshot + the relevant logs to the KivX team."
      />
      <BugReportPanel />
    </>
  );
}