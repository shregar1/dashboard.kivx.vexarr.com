import { createRoute } from '@tanstack/react-router';

import { Route as PersonalityRoute } from '@/routes/personality';
import { PageHeader } from '@/components/layout/page';
import { PersonalityDimensions } from '@/features/personality-viewer/PersonalityDimensions';

export const Route = createRoute({
  getParentRoute: () => PersonalityRoute,
  path: 'dimensions',
  component: PersonalityDimensionsPage
});

function PersonalityDimensionsPage() {
  return (
    <>
      <PageHeader
        title="Dimensions"
        description="The structured axes the engine uses to format prompts — tone, verbosity, structure."
      />
      <PersonalityDimensions />
    </>
  );
}