import { useMemo } from 'react';
import {
  Sparkles,
  RotateCcw,
  Bot,
  History
} from 'lucide-react';

import { Section } from '@/components/shared/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { usePersonality, useFormattedPersonality, useResetPersonality, useSessions } from '@/api/queries';
import type { PersonalityProfile } from '@/schemas/config';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime } from '@/lib/utils';

export function PersonalityOverview() {
  const profile = usePersonality();
  const formatted = useFormattedPersonality();
  const sessions = useSessions();
  const reset = useResetPersonality();

  const data = profile.data as PersonalityProfile | null | undefined;
  const derivedFrom = data?.derivedFromSessions ?? 0;
  const totalSessions = sessions.data?.length ?? 0;

  const confidence = useMemo(() => {
    if (derivedFrom === 0) return { label: 'No data', tone: 'warning' as const, pct: 0 };
    if (derivedFrom < 5) return { label: 'Building', tone: 'warning' as const, pct: 25 };
    if (derivedFrom < 15) return { label: 'Decent', tone: 'info' as const, pct: 60 };
    return { label: 'Strong', tone: 'success' as const, pct: 90 };
  }, [derivedFrom]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Sparkles className="size-3.5" /> Confidence
            </CardDescription>
            <CardTitle className="mt-1 text-base">{confidence.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1 w-full bg-secondary">
              <div
                className={
                  confidence.tone === 'success'
                    ? 'h-full bg-success'
                    : confidence.tone === 'info'
                      ? 'h-full bg-foreground'
                      : 'h-full bg-warning'
                }
                style={{ width: `${confidence.pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Derived from {derivedFrom} submission{derivedFrom === 1 ? '' : 's'}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Bot className="size-3.5" /> Sessions
            </CardDescription>
            <CardTitle className="mt-1 text-base">{totalSessions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">sessions recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <History className="size-3.5" /> Updated
            </CardDescription>
            <CardTitle className="mt-1 text-sm font-medium">
              {formatRelativeTime(data?.lastUpdated)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="size-3" />}
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
        title="Summary"
        description="One-paragraph description injected into every prompt."
      >
        <div className="p-4">
          {data?.summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No summary yet — submit some feedback first.</p>
          )}
        </div>
      </Section>

      <Section
        title="Formatted injection"
        description="What actually gets prepended to the system prompt at ask-time."
      >
        <div className="p-4">
          <pre className="whitespace-pre-wrap border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            {formatted.data ?? '(empty)'}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Capped at 1500 bytes — PROFILE_SECTION_MAX_BYTES.
          </p>
        </div>
      </Section>
    </div>
  );
}