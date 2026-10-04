import { createRoute } from '@tanstack/react-router';

import { Route as PersonalityRoute } from '@/routes/personality/route';
import { PageHeader } from '@/components/layout/page';
import { PersonalityRules } from '@/features/personality-viewer/PersonalityRules';

export const Route = createRoute({
  getParentRoute: () => PersonalityRoute,
  path: 'do-dont',
  component: PersonalityRulesPage
});

function PersonalityRulesPage() {
  return (
    <>
      <PageHeader
        title="Do / Don't"
        description="Positive rules (Do) and anti-patterns (Don't) derived from your session feedback."
      />
      <PersonalityRules />
    </>
  );
}