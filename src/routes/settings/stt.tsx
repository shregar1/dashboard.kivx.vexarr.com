import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { SttPanel } from '@/features/settings-stt/SttPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'stt',
  component: SttPage
});

function SttPage() {
  return (
    <>
      <PageHeader
        title="Speech-to-text"
        description="Pick the engine that transcribes the interviewer. On-device engines don't leave your machine."
      />
      <SttPanel />
    </>
  );
}