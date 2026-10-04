import { useEffect, useState, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  Star,
  AlertCircle,
  RefreshCw,
  Bot,
  Pencil,
  Sparkles,
  ChevronUp,
  Activity,
  Zap,
  Settings2,
  Gauge,
  KeyRound,
  CirclePlus,
  CircleCheck
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Confirm } from '@/components/ui/dialog';

import { useConfig, useSetConfig, useProbe, useRunProbe, useReprobe } from '@/api/queries';
import { providerEntrySchema, type ProviderEntry, type ProvidersMap } from '@/schemas/config';
import { toast } from '@/stores/toast-store';

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
  const responseMode = config.data?.responseMode ?? 'auto';
  const maxTokens = config.data?.llm?.maxTokens ?? 2048;

  const customIds = Object.keys(providers).filter(
    (id) => !BUILTIN_PROVIDERS.some((b) => b.id === id)
  );

  const allProviders: Array<{ id: string; label: string; baseURL?: string; builtin?: boolean; configured: boolean }> = [
    ...BUILTIN_PROVIDERS.map((p) => ({ ...p, configured: Boolean(providers[p.id]?.apiKey) })),
    ...customIds.map((id) => {
      const e = providers[id];
      return { id, label: e.label ?? id, baseURL: e.baseURL, builtin: e.builtin, configured: true };
    })
  ];

  const active = allProviders.find((p) => p.id === activeProvider);
  const configuredCount = allProviders.filter((p) => p.configured || providers[p.id]?.apiKey).length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top stats strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<Sparkles className="size-3.5" />}
          label="Active"
          value={active?.label ?? 'None'}
          hint={activeProvider ?? 'no provider'}
        />
        <KpiCard
          icon={<Bot className="size-3.5" />}
          label="Configured"
          value={`${configuredCount}`}
          hint={`of ${allProviders.length} available`}
        />
        <KpiCard
          icon={<Activity className="size-3.5" />}
          label="Mode"
          value={responseMode}
          hint="response verbosity"
        />
        <KpiCard
          icon={<Gauge className="size-3.5" />}
          label="Max tokens"
          value={maxTokens.toLocaleString()}
          hint="per turn"
        />
      </div>

      {/* ── Two primary config cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ActiveProviderCard
          value={activeProvider}
          providers={allProviders}
        />
        <ResponseBehaviorCard
          responseMode={responseMode}
          maxTokens={maxTokens}
        />
      </div>

      {/* ── Providers grid (full width) ───────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border p-4">
          <div>
            <CardTitle>Providers</CardTitle>
            <CardDescription>
              Each card stores its own API key, base URL, and model. The active provider is highlighted.
            </CardDescription>
          </div>
          <Badge variant="outline">{allProviders.length} total</Badge>
        </CardHeader>
        <CardContent className="p-4">
          {allProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border p-12 text-center">
              <Bot className="size-6 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">No providers yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">Add one below or pick a built-in.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allProviders.map((p) => (
                <ProviderCard
                  key={p.id}
                  id={p.id}
                  label={p.label}
                  builtin={p.builtin}
                  entry={providers[p.id] ?? {}}
                  isActive={activeProvider === p.id}
                  isConfigured={Boolean(providers[p.id]?.apiKey) || p.configured}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add custom provider card ──────────────────────────────────── */}
      <NewProviderCard />
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="gap-1 p-3">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-base">{value}</CardTitle>
        {hint && <p className="font-mono text-[10px] text-muted-foreground">{hint}</p>}
      </CardHeader>
    </Card>
  );
}

// ── Active provider card ──────────────────────────────────────────────

function ActiveProviderCard({
  value,
  providers
}: {
  value?: string;
  providers: Array<{ id: string; label: string; configured: boolean }>;
}) {
  const setConfig = useSetConfig();
  const active = providers.find((p) => p.id === value);
  const ready = active?.configured ?? false;

  return (
    <Card>
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="size-3.5 text-muted-foreground" />
          <CardTitle>Active provider</CardTitle>
        </div>
        <CardDescription>Used by default for new sessions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        <Select
          value={value ?? ''}
          onChange={(e) => setConfig.mutate({ activeProvider: e.target.value || undefined })}
          className="w-full"
        >
          <option value="">— None —</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} {p.configured ? '✓' : ''}
            </option>
          ))}
        </Select>

        {active ? (
          <div className="flex items-center justify-between border border-border bg-muted/20 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              {ready ? (
                <CircleCheck className="size-3.5 text-success" />
              ) : (
                <AlertCircle className="size-3.5 text-warning" />
              )}
              <span className="font-medium">{active.label}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{active.id}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No provider selected.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Response behaviour card ────────────────────────────────────────────

function ResponseBehaviorCard({
  responseMode,
  maxTokens
}: {
  responseMode: string;
  maxTokens: number;
}) {
  const setConfig = useSetConfig();

  return (
    <Card>
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-muted-foreground" />
          <CardTitle>Response behaviour</CardTitle>
        </div>
        <CardDescription>How KivX answers during a session.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 p-4">
        <div>
          <Label htmlFor="response-mode" className="text-xs">Mode</Label>
          <Select
            id="response-mode"
            value={responseMode}
            onChange={(e) =>
              setConfig.mutate({ responseMode: e.target.value as 'concise' | 'auto' | 'detailed' })
            }
            className="mt-1 w-full"
          >
            <option value="concise">Concise</option>
            <option value="auto">Auto</option>
            <option value="detailed">Detailed</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="max-tokens" className="text-xs">Max tokens</Label>
          <Input
            id="max-tokens"
            type="number"
            min={1}
            max={1_000_000}
            value={maxTokens}
            onChange={(e) => setConfig.mutate({ llm: { maxTokens: Number(e.target.value) } })}
            className="mt-1 w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Provider card ──────────────────────────────────────────────────────

function ProviderCard({
  id,
  label,
  builtin,
  entry,
  isActive,
  isConfigured
}: {
  id: string;
  label: string;
  builtin?: boolean;
  entry: ProviderEntry;
  isActive: boolean;
  isConfigured: boolean;
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
    toast({ variant: 'info', title: `${label} set as active` });
  }

  function remove() {
    setConfirmDelete(false);
    setConfig.mutate({ providers: { [id]: undefined } as never });
    toast({ variant: 'info', title: `Removed ${label}` });
  }

  return (
    <>
      <Card
        className={
          isActive
            ? 'border-foreground'
            : isConfigured
              ? 'border-border'
              : 'border-dashed border-border'
        }
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-1.5 truncate text-sm">
              <span className="truncate">{label}</span>
              {isActive && (
                <Badge variant="default" className="gap-1 shrink-0">
                  <Star className="size-3" /> Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="truncate">{id}</span>
              {builtin && <Badge variant="outline" className="shrink-0">built-in</Badge>}
            </CardDescription>
          </div>
          <ProbeBadge
            status={probe.data}
            isFetching={probe.isFetching || runProbeMut.isPending}
            onProbe={() => runProbeMut.mutate(id)}
            onReprobe={() => reprobeMut.mutate(id)}
          />
        </CardHeader>

        <CardContent className="flex flex-col gap-2 p-3 pt-0">
          {!isConfigured && !open && (
            <p className="border border-dashed border-border px-2 py-1.5 text-[11px] text-muted-foreground">
              No API key yet — click Edit to configure.
            </p>
          )}

          {!open ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={isActive ? 'outline' : 'primary'}
                onClick={() => setOpen(true)}
                leftIcon={<Pencil className="size-3" />}
              >
                Edit
              </Button>
              {!isActive && (
                <Button size="sm" variant="secondary" onClick={makeActive}>
                  Activate
                </Button>
              )}
              {!builtin && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 className="size-3" />}
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
            <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} rightIcon={<ChevronUp className="size-3" />}>
                Hide
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDraft(entry)} disabled={!isDirty}>
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
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <div>
        <Label htmlFor={`apiKey-${entry.id ?? ''}`} className="text-xs">
          <KeyRound className="mr-1 inline size-3" /> API key
        </Label>
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
        <Label htmlFor={`baseURL-${entry.id ?? ''}`} className="text-xs">Base URL</Label>
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
        <Label htmlFor={`model-${entry.id ?? ''}`} className="text-xs">Model</Label>
        <Input
          id={`model-${entry.id ?? ''}`}
          value={entry.model ?? ''}
          placeholder="gpt-4o-mini"
          onChange={(e) => onChange({ ...entry, model: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`path-${entry.id ?? ''}`} className="text-xs">Chat completions path (optional)</Label>
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
      </Badge>
    );
  }
  const s = status as
    | { status?: string; latencyMs?: number; message?: string; probedAt?: number }
    | undefined;
  if (!s || s.status === 'idle' || s.status === 'cached') {
    return (
      <Button size="sm" variant="ghost" onClick={onProbe} className="h-6 px-1.5 text-[10px]">
        Test
      </Button>
    );
  }
  if (s.status === 'ok') {
    return (
      <button
        type="button"
        onClick={onReprobe}
        title={`Last tested ${new Date(s.probedAt ?? 0).toLocaleString()}`}
        className="inline-flex items-center gap-1 text-[10px] text-success transition-opacity hover:opacity-70"
      >
        <Check className="size-3" />
        {s.latencyMs ? `${s.latencyMs}ms` : 'OK'}
      </button>
    );
  }
  if (s.status === 'fail') {
    return (
      <button
        type="button"
        onClick={onReprobe}
        className="inline-flex items-center gap-1 text-[10px] text-destructive transition-opacity hover:opacity-70"
      >
        <AlertCircle className="size-3" />
        {s.message ?? 'Failed'}
        <RefreshCw className="size-3" />
      </button>
    );
  }
  return null;
}

// ── Add custom provider card ───────────────────────────────────────────

function NewProviderCard() {
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
    <Card>
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <CirclePlus className="size-3.5 text-muted-foreground" />
          <CardTitle>Add custom provider</CardTitle>
        </div>
        <CardDescription>
          Use a non-default LLM endpoint — a private gateway, a self-hosted model, or a third-party
          OpenAI-compatible service.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
            placeholder="custom-provider-id"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Button
            variant="primary"
            disabled={!value}
            leftIcon={<Plus className="size-3.5" />}
            onClick={add}
            loading={setConfig.isPending}
          >
            Add provider
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

void useMemo;
void useMutation;