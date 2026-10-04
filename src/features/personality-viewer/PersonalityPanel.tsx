import { useState, type FormEvent } from 'react';
import {
  Sparkles,
  Activity,
  History,
  CheckCircle2,
  Tag as TagIcon,
  Plus,
  X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Section, EmptyState } from '@/components/shared/section';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  usePersonality,
  useFormattedPersonality,
  useResetPersonality,
  useSetPersonality,
  useSessions
} from '@/api/queries';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { PersonalityProfile } from '@/schemas/config';

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
  const setPersonality = useSetPersonality();
  const data = profile.data as PersonalityProfile | null | undefined;
  const profileEmpty = !data;

  function addRule(key: 'doRules' | 'antiPatterns', value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next: PersonalityProfile = {
      version: 1,
      summary: data?.summary ?? '',
      dimensions: data?.dimensions ?? {
        tone: 'neutral',
        verbosity: 'moderate',
        structure: 'mixed'
      },
      doRules: data?.doRules ?? [],
      antiPatterns: data?.antiPatterns ?? [],
      derivedFromSessions: data?.derivedFromSessions ?? 0,
      lastUpdated: Date.now()
    };
    next[key] = [...next[key], trimmed];
    setPersonality.mutate(next, {
      onSuccess: () =>
        toast({ variant: 'success', title: key === 'doRules' ? 'Do added' : "Don't added" }),
      onError: (e) =>
        toast({ variant: 'error', title: 'Could not save', description: String(e) })
    });
  }

  function removeRule(key: 'doRules' | 'antiPatterns', index: number) {
    if (!data) return;
    const next: PersonalityProfile = {
      ...data,
      doRules: data.doRules.filter((_, i) => i !== index),
      antiPatterns: data.antiPatterns.filter((_, i) => i !== index),
      lastUpdated: Date.now()
    };
    setPersonality.mutate(next, {
      onError: (e) =>
        toast({ variant: 'error', title: 'Could not remove', description: String(e) })
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <RulesCard
        kind="do"
        title="Do"
        description="Positive rules from high ratings + tags."
        rules={data?.doRules ?? []}
        emptyTitle="No rules yet"
        emptyDescription="Submit feedback after a few sessions, or add one manually below."
        emptyIcon={<CheckCircle2 className="size-6" />}
        onAdd={(value) => addRule('doRules', value)}
        onRemove={(i) => removeRule('doRules', i)}
        disabled={setPersonality.isPending || profileEmpty}
      />
      <RulesCard
        kind="dont"
        title="Don't"
        description="Anti-patterns from low ratings + feedback."
        rules={data?.antiPatterns ?? []}
        emptyTitle="No anti-patterns yet"
        emptyDescription="Add one manually, or wait for low-rating feedback to seed it."
        emptyIcon={<TagIcon className="size-6" />}
        onAdd={(value) => addRule('antiPatterns', value)}
        onRemove={(i) => removeRule('antiPatterns', i)}
        disabled={setPersonality.isPending || profileEmpty}
      />
    </div>
  );
}

// ── Single rules card (used for both Do and Don't) ─────────────────────

function RulesCard({
  kind,
  title,
  description,
  rules,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onAdd,
  onRemove,
  disabled
}: {
  kind: 'do' | 'dont';
  title: string;
  description: string;
  rules: string[];
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: React.ReactNode;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || disabled) return;
    setAdding(true);
    onAdd(draft);
    setDraft('');
    // Re-enable after the mutation round-trip so the user can keep
    // adding without waiting for the onSuccess toast.
    window.setTimeout(() => setAdding(false), 250);
  }

  const isDo = kind === 'do';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            {isDo ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <span className="size-2.5 bg-destructive" />
            )}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="outline">{rules.length}</Badge>
      </CardHeader>

      {/* Add row */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-b border-border p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isDo ? 'e.g. Keep answers under three sentences' : "e.g. Don't include code in the explanation"}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          leftIcon={<Plus className="size-3" />}
          disabled={!draft.trim() || disabled}
          loading={adding}
        >
          Add
        </Button>
      </form>

      <CardContent className="p-0">
        {rules.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul>
            {rules.map((r, i) => (
              <li
                key={`${i}-${r}`}
                className="group flex items-start gap-3 border-b border-border p-3 text-sm last:border-b-0"
              >
                {isDo ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                ) : (
                  <span className="mt-1 size-1.5 shrink-0 bg-destructive" />
                )}
                <span className="flex-1">{r}</span>
                <button
                  type="button"
                  aria-label={`Remove ${isDo ? 'Do' : "Don't"}`}
                  onClick={() => onRemove(i)}
                  disabled={disabled}
                  className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
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