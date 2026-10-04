import { createRoute } from '@tanstack/react-router';

import { Route as AuthedRoute } from '@/routes/_authed';
import { PageHeader } from '@/components/layout/page';
import { PersonalityPanel } from '@/features/personality-viewer/PersonalityPanel';

export const Route = createRoute({
  getParentRoute: () => AuthedRoute,
  path: 'personality',
  component: PersonalityPage
});

function PersonalityPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title="Personality"
        description="The user-style profile that gets injected into every LLM prompt. Built from your session feedback over time."
      />
      <PersonalityPanel />
    </div>
  );
}