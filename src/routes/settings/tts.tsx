import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { TtsPanel } from '@/features/settings-tts/TtsPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'tts',
  component: TtsPage
});

function TtsPage() {
  return (
    <>
      <PageHeader
        title="Text-to-speech"
        description="ElevenLabs synthesis routed through a virtual mic so the interviewer hears the answer in real time."
      />
      <TtsPanel />
    </>
  );
}