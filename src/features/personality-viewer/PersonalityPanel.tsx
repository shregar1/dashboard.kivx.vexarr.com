import { useMemo } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Layers,
  Pencil,
  Tag as TagIcon,
  Bot
} from 'lucide-react';

import { Section, SectionRow, EmptyState } from '@/components/shared/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Confirm } from '@/components/ui/dialog';

import {
  usePersonality,
  useFormattedPersonality,
  useResetPersonality,
  useSessions
} from '@/api/queries';
import type { PersonalityProfile } from '@/schemas/config';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime } from '@/lib/utils';

export function PersonalityPanel() {
  const profile = usePersonality();
  const formatted = useFormattedPersonality();
  const sessions = useSessions();
  const reset = useResetPersonality();

  const data = profile.data as PersonalityProfile | null | undefined;
  const derivedFrom = data?.derivedFromSessions ?? 0;
  const totalSessions = sessions.data?.length ?? 0;

  const confidence = useMemo(() => {
    if (derivedFrom === 0) return { label: 'No data yet', tone: 'warning' as const, pct: 0 };
    if (derivedFrom < 5) return { label: 'Building', tone: 'warning' as const, pct: 25 };
    if (derivedFrom < 15) return { label: 'Decent', tone: 'info' as const, pct: 60 };
    return { label: 'Strong', tone: 'success' as const, pct: 90 };
  }, [derivedFrom]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Confidence</CardTitle>
            <CardDescription>{confidence.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  confidence.tone === 'success' ? 'bg-success' : confidence.tone === 'info' ? 'bg-primary' : 'bg-warning'
                }`}
                style={{ width: `${confidence.pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Derived from {derivedFrom} feedback submission{derivedFrom === 1 ? '' : 's'}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="size-4" /> Sessions</CardTitle>
            <CardDescription>Across {totalSessions} total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">sessions recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="size-4" /> Last updated</CardTitle>
            <CardDescription>Profile timestamp</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatRelativeTime(data?.lastUpdated)}</p>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="size-3.5" />}
              className="mt-2"
              onClick={() =>
                reset.mutate(undefined, {
                  onSuccess: () => toast({ variant: 'info', title: 'Personality reset' })
                })
              }
              loading={reset.isPending}
            >
              Reset profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Section
        title="Dimensions"
        description="The structured dimensions the engine uses to format prompts."
      >
        <SectionRow label="Tone" description="How the LLM should sound.">
          <Badge variant="info">{data?.dimensions.tone ?? 'neutral'}</Badge>
        </SectionRow>
        <SectionRow label="Verbosity" description="How long answers should be.">
          <Badge variant="info">{data?.dimensions.verbosity ?? 'moderate'}</Badge>
        </SectionRow>
        <SectionRow label="Structure" description="Prose / mixed / bullets.">
          <Badge variant="info">{data?.dimensions.structure ?? 'mixed'}</Badge>
        </SectionRow>
      </Section>

      <Section
        title="Do rules"
        description="Generated from high ratings + positive feedback tags."
      >
        {(data?.doRules ?? []).length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-6" />} title="No rules yet" description="Submit feedback after a few sessions." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.doRules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 p-4 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Anti-patterns"
        description="Generated from low ratings + improvement feedback."
      >
        {(data?.antiPatterns ?? []).length === 0 ? (
          <EmptyState icon={<TagIcon className="size-6" />} title="No anti-patterns yet" />
        ) : (
          <ul className="divide-y divide-border">
            {data!.antiPatterns.map((r, i) => (
              <li key={i} className="flex items-start gap-3 p-4 text-sm">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-destructive" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Summary"
        description="One-paragraph description injected into every prompt."
      >
        <div className="p-5">
          {data?.summary ? (
            <p className="whitespace-pre-wrap text-sm">{data.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No summary yet — submit some feedback first.</p>
          )}
        </div>
      </Section>

      <Section
        title="Formatted injection"
        description="What actually gets prepended to the system prompt at ask-time."
      >
        <div className="p-5">
          <pre className="whitespace-pre-wrap rounded-md bg-muted/60 p-3 font-mono text-xs leading-relaxed">
            {formatted.data ?? '(empty)'}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            <Pencil className="mr-1 inline size-3" />
            Capped at 1500 bytes — see PROFILE_SECTION_MAX_BYTES in the desktop engine.
          </p>
        </div>
      </Section>
    </div>
  );
}

// silence unused
void Confirm;