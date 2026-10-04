import { CheckCircle2, Tag as TagIcon } from 'lucide-react';

import { Section, EmptyState } from '@/components/shared/section';

import { usePersonality } from '@/api/queries';
import type { PersonalityProfile } from '@/schemas/config';

export function PersonalityRules() {
  const profile = usePersonality();
  const data = profile.data as PersonalityProfile | null | undefined;
  const doRules = data?.doRules ?? [];
  const antiPatterns = data?.antiPatterns ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Do"
        description="Generated from high ratings + positive feedback tags."
      >
        {doRules.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-6" />}
            title="No rules yet"
            description="Submit feedback after a few sessions."
          />
        ) : (
          <ul>
            {doRules.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-border p-3 text-sm last:border-b-0"
              >
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Don't"
        description="Generated from low ratings + improvement feedback."
      >
        {antiPatterns.length === 0 ? (
          <EmptyState icon={<TagIcon className="size-6" />} title="No anti-patterns yet" />
        ) : (
          <ul>
            {antiPatterns.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-border p-3 text-sm last:border-b-0"
              >
                <span className="mt-1 size-1.5 shrink-0 bg-destructive" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}