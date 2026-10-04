import { useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  Star,
  AlertCircle,
  RefreshCw,
  Bot
} from 'lucide-react';

import { Section, SectionRow, EmptyState } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Confirm } from '@/components/ui/dialog';

import { useConfig, useSetConfig, useProbe, useRunProbe, useReprobe } from '@/api/queries';
import { providerEntrySchema, type ProviderEntry, type ProvidersMap } from '@/schemas/config';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime } from '@/lib/utils';

const BUILTIN_PROVIDERS: Array<{ id: string; label: string; baseURL?: string; builtin?: boolean }> = [
  { id: 'anthropic', label: 'Anthropic', baseURL: 'https://api.anthropic.com/v1', builtin: true },
  { id: 'openai', label: 'OpenAI', baseURL: 'https://api.openai.com/v1', builtin: true },
  { id: 'gemini', label: 'Google Gemini', builtin: true },
  { id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', builtin: true },
  { id: 'openrouter', label: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', builtin: true },
  { id: 'groq', label: 'Groq', baseURL: 'https://api.groq.com/openai/v1', builtin: true },
  { id: 'mistral', label: 'Mistral', baseURL: 'https://api.mistral.ai/v1', builtin: true },
  { id: 'kiv', label: 'KivX (hosted)', builtin: true },
  { id: 'local-ollama', label: 'Local (Ollama)', baseURL: 'http://127.0.0.1:11434/v1', builtin: true },
  { id: 'custom', label: 'Custom OpenAI-compatible' }
];

export function LlmProvidersPanel() {
  const config = useConfig();
  const providers = (config.data?.providers ?? {}) as ProvidersMap;
  const activeProvider = config.data?.activeProvider;

  const customIds = Object.keys(providers).filter(
    (id) => !BUILTIN_PROVIDERS.some((b) => b.id === id)
  );

  const allProviders = [
    ...BUILTIN_PROVIDERS.map((p) => ({ ...p, configured: Boolean(providers[p.id]?.apiKey) })),
    ...customIds.map((id) => {
      const e = providers[id];
      return { id, label: e.label ?? id, baseURL: e.baseURL, builtin: e.builtin };
    })
  ];

  const responseMode = config.data?.responseMode ?? 'auto';

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Active provider"
        description="The model that answers questions during a session."
      >
        <SectionRow label="Provider" description="Used by default for new sessions.">
          <ActiveProviderSelect value={activeProvider} providers={allProviders} />
        </SectionRow>

        <SectionRow label="Response mode" description="How verbose KivX's answers should be.">
          <ResponseModeSelect value={responseMode} />
        </SectionRow>

        <SectionRow label="Max tokens" description="Cap on the answer length per turn.">
          <MaxTokensField />
        </SectionRow>
      </Section>

      <Section
        title="Configured providers"
        description="Each provider card stores its own API key, base URL, and model. The active provider is highlighted."
      >
        {allProviders.length === 0 ? (
          <EmptyState
            icon={<Bot className="size-6" />}
            title="No providers yet"
            description="Add one below or pick a built-in from the dropdown."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {allProviders.map((p) => (
              <ProviderCard
                key={p.id}
                id={p.id}
                label={p.label}
                builtin={p.builtin}
                entry={providers[p.id] ?? {}}
                isActive={activeProvider === p.id}
              />
            ))}
          </div>
        )}

        <div className="border-t border-border p-5">
          <NewProviderInline />
        </div>
      </Section>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

function ActiveProviderSelect({
  value,
  providers
}: {
  value?: string;
  providers: Array<{ id: string; label: string }>;
}) {
  const setConfig = useSetConfig();
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => setConfig.mutate({ activeProvider: e.target.value || undefined })}
      className="w-72"
    >
      <option value="">— None —</option>
      {providers.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </Select>
  );
}

function ResponseModeSelect({ value }: { value: string }) {
  const setConfig = useSetConfig();
  return (
    <Select
      value={value}
      onChange={(e) => setConfig.mutate({ responseMode: e.target.value as 'concise' | 'auto' | 'detailed' })}
      className="w-72"
    >
      <option value="concise">Concise</option>
      <option value="auto">Auto (match the question)</option>
      <option value="detailed">Detailed</option>
    </Select>
  );
}

function MaxTokensField() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const value = config.data?.llm?.maxTokens ?? 2048;
  return (
    <Input
      type="number"
      min={1}
      max={1_000_000}
      value={value}
      onChange={(e) =>
        setConfig.mutate({ llm: { ...config.data?.llm, maxTokens: Number(e.target.value) } })
      }
      className="w-32"
    />
  );
}

function ProviderCard({
  id,
  label,
  builtin,
  entry,
  isActive
}: {
  id: string;
  label: string;
  builtin?: boolean;
  entry: ProviderEntry;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<ProviderEntry>(entry);

  useEffect(() => {
    setDraft(entry);
  }, [entry]);

  const probe = useProbe(id);
  const runProbeMut = useRunProbe();
  const reprobeMut = useReprobe();
  const setConfig = useSetConfig();

  const isDirty = JSON.stringify(draft) !== JSON.stringify(entry);

  function save() {
    const parsed = providerEntrySchema.safeParse(draft);
    if (!parsed.success) {
      toast({
        variant: 'error',
        title: 'Invalid provider config',
        description: parsed.error.issues[0]?.message
      });
      return;
    }
    setConfig.mutate({ providers: { [id]: parsed.data } });
    toast({ variant: 'success', title: `Saved ${label}` });
  }

  function makeActive() {
    setConfig.mutate({ activeProvider: id });
  }

  function remove() {
    setConfirmDelete(false);
    // We can't easily remove a single key with the desktop validator —
    // it strips unknowns but doesn't take a "delete" sentinel. The desktop
    // side handles `{providers: {[id]: undefined}}` specially: any key
    // whose value is `undefined` is dropped from the providers map.
    setConfig.mutate({ providers: { [id]: undefined } as never });
    toast({ variant: 'info', title: `Removed ${label}` });
  }

  return (
    <>
      <Card className={isActive ? 'border-primary/50 ring-1 ring-primary/30' : undefined}>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              {label}
              {isActive && (
                <Badge variant="success" className="gap-1">
                  <Star className="size-3" /> active
                </Badge>
              )}
              {builtin && <Badge variant="info">built-in</Badge>}
            </CardTitle>
            <CardDescription>
              <span className="font-mono text-xs">{id}</span>
            </CardDescription>
          </div>
          <ProbeBadge
            status={probe.data}
            isFetching={probe.isFetching || runProbeMut.isPending}
            onProbe={() => runProbeMut.mutate(id)}
            onReprobe={() => reprobeMut.mutate(id)}
          />
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {!open ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                Edit
              </Button>
              {!isActive && (
                <Button size="sm" variant="secondary" onClick={makeActive}>
                  Make active
                </Button>
              )}
              {!builtin && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 className="size-3.5" />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <ProviderFormFields entry={draft} onChange={setDraft} />
          )}

          {open && (
            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(entry)}
                disabled={!isDirty}
              >
                Discard
              </Button>
              <Button size="sm" onClick={save} disabled={!isDirty} loading={setConfig.isPending}>
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Confirm
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Remove ${label}?`}
        description="Its API key is forgotten. You can re-add it later."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={remove}
      />
    </>
  );
}

function ProviderFormFields({
  entry,
  onChange
}: {
  entry: ProviderEntry;
  onChange: (v: ProviderEntry) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor={`apiKey-${entry.id ?? ''}`}>API key</Label>
        <Input
          id={`apiKey-${entry.id ?? ''}`}
          type="password"
          autoComplete="off"
          value={entry.apiKey ?? ''}
          placeholder="sk-…"
          onChange={(e) => onChange({ ...entry, apiKey: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`baseURL-${entry.id ?? ''}`}>Base URL</Label>
        <Input
          id={`baseURL-${entry.id ?? ''}`}
          type="url"
          value={entry.baseURL ?? ''}
          placeholder="https://api.openai.com/v1"
          onChange={(e) => onChange({ ...entry, baseURL: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`model-${entry.id ?? ''}`}>Model</Label>
        <Input
          id={`model-${entry.id ?? ''}`}
          value={entry.model ?? ''}
          placeholder="gpt-4o-mini"
          onChange={(e) => onChange({ ...entry, model: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`path-${entry.id ?? ''}`}>Chat completions path (optional)</Label>
        <Input
          id={`path-${entry.id ?? ''}`}
          value={entry.chatCompletionsPath ?? ''}
          placeholder="/chat/completions"
          onChange={(e) => onChange({ ...entry, chatCompletionsPath: e.target.value })}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function ProbeBadge({
  status,
  isFetching,
  onProbe,
  onReprobe
}: {
  status: unknown;
  isFetching: boolean;
  onProbe: () => void;
  onReprobe: () => void;
}) {
  if (isFetching) {
    return (
      <Badge variant="info" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        probing
      </Badge>
    );
  }
  const s = status as
    | { status?: string; latencyMs?: number; message?: string; probedAt?: number }
    | undefined;
  if (!s || s.status === 'idle' || s.status === 'cached') {
    return (
      <Button size="sm" variant="ghost" onClick={onProbe} className="h-7 px-2 text-xs">
        Test
      </Button>
    );
  }
  if (s.status === 'ok') {
    return (
      <button
        type="button"
        onClick={onReprobe}
        title={`Last tested ${formatRelativeTime(s.probedAt)}`}
        className="flex items-center gap-1 text-xs text-success transition-opacity hover:opacity-80"
      >
        <Check className="size-3" />
        {s.latencyMs ? `${s.latencyMs}ms` : 'ok'}
      </button>
    );
  }
  if (s.status === 'fail') {
    return (
      <button
        type="button"
        onClick={onReprobe}
        className="flex items-center gap-1 text-xs text-destructive transition-opacity hover:opacity-80"
      >
        <AlertCircle className="size-3" />
        {s.message ?? 'failed'}
        <RefreshCw className="size-3" />
      </button>
    );
  }
  return null;
}

function NewProviderInline() {
  const [value, setValue] = useState('');
  const setConfig = useSetConfig();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  function add() {
    if (!value) return;
    setConfig.mutate(
      { providers: { [value]: { id: value, builtin: false, model: '' } } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: `Added ${value}` });
          setValue('');
          void qc.invalidateQueries({ queryKey: ['config'] });
          inputRef.current?.focus();
        }
      }
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
        placeholder="custom-provider-id"
        className="w-64"
        onKeyDown={(e) => e.key === 'Enter' && add()}
      />
      <Button
        size="sm"
        disabled={!value}
        leftIcon={<Plus className="size-3.5" />}
        onClick={add}
        loading={setConfig.isPending}
      >
        Add provider
      </Button>
    </div>
  );
}

// keep imports referenced
void useMemo;
void useRef;
void useQueryClient;
void useMutation;