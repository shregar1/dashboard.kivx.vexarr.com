import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { LlmProvidersPanel } from '@/features/settings-llm/LlmProvidersPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'llm',
  component: LlmPage
});

function LlmPage() {
  return (
    <>
      <PageHeader
        title="LLM providers"
        description="Configure the language model services KivX uses for live answers, session analysis, and the personality profile."
      />
      <LlmProvidersPanel />
    </>
  );
}