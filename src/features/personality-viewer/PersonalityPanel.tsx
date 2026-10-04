import { useState } from 'react';
import {
  Sparkles,
  Activity,
  History,
  CheckCircle2,
  Tag as TagIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Section, EmptyState } from '@/components/shared/section';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { usePersonality, useFormattedPersonality, useResetPersonality, useSessions } from '@/api/queries';
import type { PersonalityProfile } from '@/schemas/config';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'dimensions' | 'do-dont';

const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'dimensions', label: 'Dimensions', icon: Activity },
  { id: 'do-dont', label: "Do / Don't", icon: History }
];

export function PersonalityPanel() {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon className="mr-1.5 size-3" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="dimensions">
          <DimensionsTab />
        </TabsContent>
        <TabsContent value="do-dont">
          <DoDontTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────────

function OverviewTab() {
  const profile = usePersonality();
  const formatted = useFormattedPersonality();
  const sessions = useSessions();
  const reset = useResetPersonality();

  const data = profile.data as PersonalityProfile | null | undefined;
  const derivedFrom = data?.derivedFromSessions ?? 0;
  const totalSessions = sessions.data?.length ?? 0;

  // Confidence band (matches the dashboard home computation).
  const confidence = (() => {
    if (derivedFrom === 0) return { label: 'No data', tone: 'warning' as const };
    if (derivedFrom < 5) return { label: 'Building', tone: 'warning' as const };
    if (derivedFrom < 15) return { label: 'Decent', tone: 'info' as const };
    return { label: 'Strong', tone: 'success' as const };
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard label="Confidence" value={confidence.label} tone={confidence.tone} />
        <KpiCard label="Sessions" value={String(totalSessions)} hint="recorded" />
        <KpiCard label="Updated" value={formatRelativeTime(data?.lastUpdated)} />
      </div>

      <Card>
        <CardHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <CardTitle>Summary</CardTitle>
            <Badge variant="outline">injected into every prompt</Badge>
          </div>
          <CardDescription>
            The one-paragraph description the engine prefixes to every ask.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {data?.summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No summary yet — submit some feedback to seed the profile.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <CardTitle>Formatted injection</CardTitle>
            <Badge variant="outline">1500 bytes max</Badge>
          </div>
          <CardDescription>What actually gets prepended at ask-time.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <pre className="whitespace-pre-wrap border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            {formatted.data ?? '(empty)'}
          </pre>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                reset.mutate(undefined, {
                  onSuccess: () => toast({ variant: 'info', title: 'Personality reset' })
                })
              }
              loading={reset.isPending}
            >
              Reset profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dimensions tab ─────────────────────────────────────────────────────

function DimensionsTab() {
  const profile = usePersonality();
  const data = profile.data as PersonalityProfile | null | undefined;

  return (
    <Section
      title="Dimensions"
      description="The structured axes the engine uses to format prompts."
    >
      <div className="divide-y divide-border">
        <DimensionRow
          label="Tone"
          description="How the LLM should sound."
          value={data?.dimensions.tone ?? 'neutral'}
        />
        <DimensionRow
          label="Verbosity"
          description="How long answers should be."
          value={data?.dimensions.verbosity ?? 'moderate'}
        />
        <DimensionRow
          label="Structure"
          description="Prose / mixed / bullets."
          value={data?.dimensions.structure ?? 'mixed'}
        />
      </div>
    </Section>
  );
}

function DimensionRow({
  label,
  description,
  value
}: {
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3">
      <div className="max-w-md">
        <div className="text-sm font-medium">{label}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}

// ── Do / Don't tab ─────────────────────────────────────────────────────

function DoDontTab() {
  const profile = usePersonality();
  const data = profile.data as PersonalityProfile | null | undefined;
  const doRules = data?.doRules ?? [];
  const antiPatterns = data?.antiPatterns ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              Do
            </CardTitle>
            <CardDescription>Positive rules from high ratings + tags.</CardDescription>
          </div>
          <Badge variant="outline">{doRules.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="size-2.5 bg-destructive" />
              Don't
            </CardTitle>
            <CardDescription>Anti-patterns from low ratings + feedback.</CardDescription>
          </div>
          <Badge variant="outline">{antiPatterns.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {antiPatterns.length === 0 ? (
            <EmptyState
              icon={<TagIcon className="size-6" />}
              title="No anti-patterns yet"
            />
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
        </CardContent>
      </Card>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'success' | 'warning' | 'info';
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            'mt-1 text-base font-semibold tracking-tight',
            tone === 'success' && 'text-success',
            tone === 'warning' && 'text-warning',
            tone === 'info' && 'text-foreground'
          )}
        >
          {value}
        </div>
        {hint && (
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}