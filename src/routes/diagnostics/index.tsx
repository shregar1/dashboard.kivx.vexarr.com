import { createRoute } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageHeader } from '@/components/layout/page';
import { DiagnosticsPanel } from '@/features/diagnostics-panel/DiagnosticsPanel';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'diagnostics',
  component: DiagnosticsPage
});

function DiagnosticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title="Diagnostics"
        description="Live snapshot of the KivX host — platform, permissions, windows, hot-path latency, and update status."
      />
      <DiagnosticsPanel />
    </div>
  );
}