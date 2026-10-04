import { createRoute } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageHeader } from '@/components/layout/page';
import { BugReportPanel } from '@/features/diagnostics-panel/BugReportPanel';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'diagnostics/bug-report',
  component: BugReportPage
});

function BugReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <PageHeader
        title="Bug report"
        description="Capture a snapshot of the host, attach recent logs, and send the report to the KivX team."
      />
      <BugReportPanel />
    </div>
  );
}