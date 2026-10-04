import { createRoute } from '@tanstack/react-router';

import { Route as PersonalityRoute } from '@/routes/personality/route';
import { PageHeader } from '@/components/layout/page';
import { PersonalityOverview } from '@/features/personality-viewer/PersonalityOverview';

export const Route = createRoute({
  getParentRoute: () => PersonalityRoute,
  path: 'overview',
  component: PersonalityOverviewPage
});

function PersonalityOverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Confidence score, sessions, and the summary that gets injected into every LLM prompt."
      />
      <PersonalityOverview />
    </>
  );
}