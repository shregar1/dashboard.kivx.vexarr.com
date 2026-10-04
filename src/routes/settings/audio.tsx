import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { AudioPanel } from '@/features/settings-audio/AudioPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'audio',
  component: AudioPage
});

function AudioPage() {
  return (
    <>
      <PageHeader
        title="Audio"
        description="Microphone, system-audio loopback, and translation. Settings here apply globally across sessions."
      />
      <AudioPanel />
    </>
  );
}