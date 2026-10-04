import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Keyboard, X, RotateCcw } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig } from '@/api/queries';
import { hotkeysSchema } from '@/schemas/config';
import { toast } from '@/stores/toast-store';

const DEFAULT_HOTKEYS: Array<{ key: string; label: string; description: string; defaultValue: string }> = [
  { key: 'overlayToggle', label: 'Show / hide overlay', description: 'Toggle the in-call overlay pill.', defaultValue: 'Cmd+Shift+O' },
  { key: 'askClipboard', label: 'Ask LLM about clipboard', description: 'Send the current clipboard contents as a question.', defaultValue: 'Cmd+Shift+S' },
  { key: 'typeClipboard', label: 'Type clipboard', description: 'Human-type the current clipboard contents into the focused app.', defaultValue: 'Cmd+Shift+T' },
  { key: 'typeLastAnswer', label: 'Type last answer', description: 'Human-type the LLM\'s last answer.', defaultValue: 'Cmd+Shift+Y' },
  { key: 'cancelInFlight', label: 'Cancel in-flight LLM call', description: 'Abort the current ask-clipboard request.', defaultValue: 'Escape' },
  { key: 'panic', label: 'Panic hotkey', description: 'Hide every window and wipe state.', defaultValue: 'Cmd+Shift+P' }
];

export function HotkeysPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const hotkeys = hotkeysSchema.parse(config.data?.hotkeys ?? {});

  function update(key: string, value: string) {
    setConfig.mutate({ hotkeys: { ...hotkeys, [key]: value } });
  }

  function resetKey(h: typeof DEFAULT_HOTKEYS[number]) {
    setConfig.mutate({ hotkeys: { ...hotkeys, [h.key]: h.defaultValue } });
    toast({ variant: 'info', title: `Reset ${h.label}` });
  }

  return (
    <Section
      title="Hotkeys"
      description="Click a row's field and tap the keys you want to bind. Press Esc while focused to clear."
    >
      {DEFAULT_HOTKEYS.map((h) => (
        <SectionRow key={h.key} label={h.label} description={h.description} horizontal={false}>
          <div className="flex items-center gap-2">
            <HotkeyInput
              value={hotkeys[h.key] ?? ''}
              placeholder={h.defaultValue}
              onChange={(v) => update(h.key, v)}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset to default"
              onClick={() => resetKey(h)}
              title={`Reset to default (${h.defaultValue})`}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </SectionRow>
      ))}
    </Section>
  );
}

function HotkeyInput({
  value,
  placeholder,
  onChange
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!recording) return;
    function onKey(e: globalThis.KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecording(false);
        return;
      }
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl');
      if (e.altKey) parts.push('Option');
      if (e.shiftKey) parts.push('Shift');
      const k = e.key;
      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(k)) {
        parts.push(k.length === 1 ? k.toUpperCase() : k);
      }
      if (parts.length > 0) {
        onChange(parts.join('+'));
        setRecording(false);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, onChange]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') setRecording(true);
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        placeholder={placeholder ?? 'Click then press keys'}
        readOnly={recording}
        onFocus={() => setRecording(true)}
        onKeyDown={handleKey}
        className="w-64 font-mono text-xs"
      />
      {recording && (
        <Badge variant="info" className="absolute -top-2 right-2 gap-1">
          <Keyboard className="size-3" /> recording…
        </Badge>
      )}
      {value && !recording && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}