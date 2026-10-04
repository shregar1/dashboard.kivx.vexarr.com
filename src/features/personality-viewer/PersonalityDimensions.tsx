import { Section, SectionRow } from '@/components/shared/section';
import { Badge } from '@/components/ui/badge';

import { usePersonality } from '@/api/queries';
import type { PersonalityProfile } from '@/schemas/config';

export function PersonalityDimensions() {
  const profile = usePersonality();
  const data = profile.data as PersonalityProfile | null | undefined;

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Dimensions"
        description="The structured dimensions the engine uses to format prompts."
      >
        <SectionRow label="Tone" description="How the LLM should sound.">
          <Badge variant="outline">{data?.dimensions.tone ?? 'neutral'}</Badge>
        </SectionRow>
        <SectionRow label="Verbosity" description="How long answers should be.">
          <Badge variant="outline">{data?.dimensions.verbosity ?? 'moderate'}</Badge>
        </SectionRow>
        <SectionRow label="Structure" description="Prose / mixed / bullets.">
          <Badge variant="outline">{data?.dimensions.structure ?? 'mixed'}</Badge>
        </SectionRow>
      </Section>
    </div>
  );
}