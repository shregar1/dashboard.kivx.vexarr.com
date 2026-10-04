import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { HotkeysPanel } from '@/features/settings-hotkeys/HotkeysPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'hotkeys',
  component: HotkeysPage
});

function HotkeysPage() {
  return (
    <>
      <PageHeader
        title="Hotkeys"
        description="Keyboard shortcuts for the overlay, LLM hotkeys, and panic button. Bindings are global once a session starts."
      />
      <HotkeysPanel />
    </>
  );
}