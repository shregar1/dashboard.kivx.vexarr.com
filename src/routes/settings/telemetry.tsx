import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { TelemetryPanel } from '@/features/settings-telemetry/TelemetryPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'telemetry',
  component: TelemetryPage
});

function TelemetryPage() {
  return (
    <>
      <PageHeader
        title="Telemetry & stealth"
        description="Anonymous usage telemetry, plus the stealth / anti-detection switches."
      />
      <TelemetryPanel />
    </>
  );
}