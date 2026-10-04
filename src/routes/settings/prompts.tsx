import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { PromptTemplatesPanel } from '@/features/settings-prompts/PromptTemplatesPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'prompts',
  component: PromptsPage
});

function PromptsPage() {
  return (
    <>
      <PageHeader
        title="Prompt templates"
        description="System prompts prepended to every LLM call. Variables in the body (e.g. {{company}}) are filled at session start."
      />
      <PromptTemplatesPanel />
    </>
  );
}