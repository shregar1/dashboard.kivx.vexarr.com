import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import {
  Keyboard,
  X,
  RotateCcw,
  Command,
  CornerDownLeft,
  AlertTriangle,
  Eye,
  Clipboard,
  Type,
  History,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig } from '@/api/queries';
import { hotkeysSchema } from '@/schemas/config';
import { toast } from '@/stores/toast-store';
import { cn } from '@/lib/utils';

interface HotkeyDef {
  key: string;
  label: string;
  description: string;
  defaultValue: string;
  group: 'visibility' | 'llm' | 'output' | 'emergency';
  icon: typeof Eye;
}

const DEFAULT_HOTKEYS: HotkeyDef[] = [
  { key: 'overlayToggle', label: 'Show / hide overlay', description: 'Toggle the in-call overlay pill.', defaultValue: 'Cmd+Shift+O', group: 'visibility', icon: Eye },
  { key: 'askClipboard', label: 'Ask LLM about clipboard', description: 'Send the current clipboard contents as a question.', defaultValue: 'Cmd+Shift+S', group: 'llm', icon: Clipboard },
  { key: 'typeClipboard', label: 'Type clipboard', description: 'Human-type the current clipboard contents into the focused app.', defaultValue: 'Cmd+Shift+T', group: 'output', icon: Type },
  { key: 'typeLastAnswer', label: 'Type last answer', description: "Human-type the LLM's last answer.", defaultValue: 'Cmd+Shift+Y', group: 'output', icon: History },
  { key: 'cancelInFlight', label: 'Cancel in-flight LLM call', description: 'Abort the current ask-clipboard request.', defaultValue: 'Escape', group: 'emergency', icon: ShieldAlert },
  { key: 'panic', label: 'Panic hotkey', description: 'Hide every window and wipe state.', defaultValue: 'Cmd+Shift+P', group: 'emergency', icon: AlertTriangle }
];

const GROUPS: Array<{ id: HotkeyDef['group']; label: string; description: string }> = [
  { id: 'visibility', label: 'Visibility', description: 'Show, hide, and switch surfaces during a call.' },
  { id: 'llm', label: 'LLM', description: 'Trigger model calls and capture context.' },
  { id: 'output', label: 'Output', description: 'Move answers and clipboard content into the meeting app.' },
  { id: 'emergency', label: 'Emergency', description: 'Abort, hide, or wipe state when something goes wrong.' }
];

export function HotkeysPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const hotkeys = hotkeysSchema.parse(config.data?.hotkeys ?? {});

  function update(key: string, value: string) {
    setConfig.mutate({ hotkeys: { ...hotkeys, [key]: value } });
  }

  function resetKey(h: HotkeyDef) {
    setConfig.mutate({ hotkeys: { ...hotkeys, [h.key]: h.defaultValue } });
    toast({ variant: 'info', title: `Reset ${h.label}` });
  }

  function resetAll() {
    const next: Record<string, string> = {};
    for (const h of DEFAULT_HOTKEYS) next[h.key] = h.defaultValue;
    setConfig.mutate({ hotkeys: next });
    toast({ variant: 'info', title: 'All hotkeys reset to defaults' });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero — explains how capture works */}
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted/30">
            <Keyboard className="size-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Rebind any key combo</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click a binding to start recording, then press the keys you want. Press{' '}
              <KbdKey>Esc</KbdKey> while recording to cancel. Changes save automatically.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="size-3" />}
            onClick={resetAll}
          >
            Reset all
          </Button>
        </CardContent>
      </Card>

      {/* Grouped hotkey cards */}
      {GROUPS.map((group) => {
        const items = DEFAULT_HOTKEYS.filter((h) => h.group === group.id);
        if (items.length === 0) return null;
        return (
          <Card key={group.id}>
            <CardHeader className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = items[0].icon;
                    return <Icon className="size-3.5" />;
                  })()}
                  {group.label}
                </CardTitle>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {items.map((h) => (
                <HotkeyRow
                  key={h.key}
                  def={h}
                  value={hotkeys[h.key] ?? ''}
                  onChange={(v) => update(h.key, v)}
                  onReset={() => resetKey(h)}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Single row ─────────────────────────────────────────────────────────

function HotkeyRow({
  def,
  value,
  onChange,
  onReset
}: {
  def: HotkeyDef;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const Icon = def.icon;

  return (
    <div className="flex items-center gap-4 border-b border-border p-4 last:border-b-0">
      <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted/20">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{def.label}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{def.description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {recording ? (
          <RecordingCapture onCapture={onChange} onCancel={() => setRecording(false)} />
        ) : (
          <BindingButton
            value={value}
            defaultValue={def.defaultValue}
            onClick={() => setRecording(true)}
            onClear={value ? () => onChange('') : undefined}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset to default"
          title={`Reset to default (${def.defaultValue})`}
          onClick={onReset}
      >
        <RotateCcw className="size-3.5" />
      </Button>
      </div>
    </div>
  );
}

// ── Binding display (chip row) ────────────────────────────────────────

function BindingButton({
  value,
  defaultValue,
  onClick,
  onClear
}: {
  value: string;
  defaultValue: string;
  onClick: () => void;
  onClear?: () => void;
}) {
  const isOverridden = value && value !== defaultValue;

  return (
    <div className="group flex items-center gap-2">
      {value ? (
        <KbdCombo combo={value} isOverridden={isOverridden} />
      ) : (
        <span className="border border-dashed border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Unbound
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex h-7 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
          'hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        <Keyboard className="size-3" />
        Rebind
      </button>
      {onClear && (
        <button
          type="button"
          aria-label="Clear binding"
          onClick={onClear}
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Recording capture (full-row interactive) ──────────────────────────

function RecordingCapture({
  onCapture,
  onCancel
}: {
  onCapture: (v: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Subtle pulse on every key event — visual feedback for capture.
  useEffect(() => {
    function onKey() {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 80);
      return () => window.clearTimeout(t);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const onKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) {
        parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl');
      }
      if (e.altKey) parts.push('Option');
      if (e.shiftKey) parts.push('Shift');
      const k = e.key;
      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(k)) {
        parts.push(k.length === 1 ? k.toUpperCase() : k);
      }
      if (parts.length > 0) {
        onCapture(parts.join('+'));
      }
    },
    [onCapture, onCancel]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onKeyDown]);

  return (
    <div
      className={cn(
        'flex h-7 items-center gap-2 border border-foreground bg-foreground px-2.5 text-background transition-transform',
        pulse && 'scale-[1.02]'
      )}
    >
      <span className="size-1.5 animate-pulse bg-background" />
      <span className="font-mono text-[10px] uppercase tracking-wider">Press a key</span>
      <button
        type="button"
        onClick={onCancel}
        className="ml-1 text-background/70 transition-colors hover:text-background"
        aria-label="Cancel recording"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

// ── Single key chip + combo ───────────────────────────────────────────

const KEY_LABEL: Record<string, { label: string; icon?: typeof Command }> = {
  Cmd: { label: '⌘', icon: Command },
  Ctrl: { label: '⌃' },
  Option: { label: '⌥' },
  Shift: { label: '⇧' },
  Enter: { label: '↩', icon: CornerDownLeft },
  Escape: { label: 'Esc' }
};

function KbdCombo({ combo, isOverridden }: { combo: string; isOverridden?: boolean }) {
  const parts = combo.split('+');
  return (
    <div
      className={cn(
        'flex h-7 items-center gap-1 border bg-background px-2',
        isOverridden ? 'border-accent' : 'border-border'
      )}
    >
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <KbdKey>{p}</KbdKey>
          {i < parts.length - 1 && (
            <span className="font-mono text-[10px] text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

function KbdKey({ children }: { children: React.ReactNode }) {
  const text = String(children);
  const meta = KEY_LABEL[text];
  const isMacKey = text === 'Cmd' || text === 'Option' || text === 'Shift' || text === 'Ctrl';
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center border border-border bg-secondary px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
        isMacKey && 'text-[11px]'
      )}
    >
      {meta?.label ?? text}
    </kbd>
  );
}