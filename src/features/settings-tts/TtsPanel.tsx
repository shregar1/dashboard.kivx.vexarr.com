import { useState } from 'react';
import { Wand2, Volume2, Play, Square, KeyRound } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useTtsConfig, useTtsSetupStatus, useSetTtsConfig } from '@/api/queries';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';

export function TtsPanel() {
  const config = useTtsConfig();
  const setup = useTtsSetupStatus();
  const setConfig = useSetTtsConfig();
  const [synth, setSynth] = useState('');

  const cfg = (config.data ?? {}) as {
    enabled?: boolean;
    apiKey?: string;
    voiceId?: string;
    modelId?: string;
    stability?: number;
    similarityBoost?: number;
    autoSpeak?: boolean;
  };

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Text-to-speech"
        description="ElevenLabs voice synthesis. The output routes to a virtual mic so you can answer the interview in your own cloned voice."
      >
        <SectionRow label="Enabled" description="Allow the LLM's answers to be spoken aloud.">
          <Switch
            checked={Boolean(cfg.enabled)}
            onCheckedChange={(v) => setConfig.mutate({ enabled: v })}
          />
        </SectionRow>

        <SectionRow label="Auto-speak" description="Speak every LLM answer without confirmation.">
          <Switch
            checked={Boolean(cfg.autoSpeak)}
            onCheckedChange={(v) => setConfig.mutate({ autoSpeak: v })}
          />
        </SectionRow>

        <SectionRow label="API key" description="ElevenLabs API key.">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="off"
              value={cfg.apiKey ?? ''}
              placeholder="xi-api-key…"
              onChange={(e) => setConfig.mutate({ apiKey: e.target.value })}
              className="w-72"
            />
          </div>
        </SectionRow>

        <SectionRow label="Voice ID" description="The voice to use. Find it in your ElevenLabs dashboard.">
          <Input
            value={cfg.voiceId ?? ''}
            placeholder="21m00Tcm4TlvDq8ikWAM"
            onChange={(e) => setConfig.mutate({ voiceId: e.target.value })}
            className="w-72 font-mono text-xs"
          />
        </SectionRow>

        <SectionRow label="Model" description="ElevenLabs model ID. Defaults to eleven_multilingual_v2.">
          <Input
            value={cfg.modelId ?? ''}
            placeholder="eleven_multilingual_v2"
            onChange={(e) => setConfig.mutate({ modelId: e.target.value })}
            className="w-72"
          />
        </SectionRow>

        <SectionRow label="Stability" description="Higher = steadier voice; lower = more expressive.">
          <Slider
            value={cfg.stability ?? 0.5}
            onValueChange={(v) => setConfig.mutate({ stability: v })}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => v.toFixed(2)}
            className="w-64"
          />
        </SectionRow>

        <SectionRow label="Similarity boost" description="How closely to stick to the original voice.">
          <Slider
            value={cfg.similarityBoost ?? 0.75}
            onValueChange={(v) => setConfig.mutate({ similarityBoost: v })}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => v.toFixed(2)}
            className="w-64"
          />
        </SectionRow>
      </Section>

      <Section
        title="Setup wizard"
        description="Wires ElevenLabs → BlackHole → virtual mic so the interviewer hears your synthesized voice."
      >
        <SectionRow label="Setup status" description="Last completed step in the wizard.">
          <SetupBadge data={setup.data as { step?: string; ok?: boolean } | undefined} />
        </SectionRow>

        <SectionRow label="Run setup" description="Reset and re-run the wizard.">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Wand2 className="size-3.5" />}
            onClick={() =>
              ipc
                .ttsAutoSetup()
                .then(() => toast({ variant: 'success', title: 'TTS wizard started' }))
                .catch((e) => toast({ variant: 'error', title: 'Wizard failed', description: String(e) }))
            }
          >
            Run setup
          </Button>
        </SectionRow>

        <SectionRow label="Quick test" description="Speak a phrase through the configured voice.">
          <div className="flex items-center gap-2">
            <Input
              value={synth}
              onChange={(e) => setSynth(e.target.value)}
              placeholder="Type a phrase…"
              className="w-72"
            />
            <Button
              size="icon"
              variant="secondary"
              aria-label="Speak"
              disabled={!synth}
              onClick={() =>
                ipc
                  .ttsSynthesize(synth)
                  .catch((e) => toast({ variant: 'error', title: 'Synthesis failed', description: String(e) }))
              }
            >
              <Play className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Stop"
              onClick={() => ipc.ttsStop()}
            >
              <Square className="size-4" />
            </Button>
          </div>
        </SectionRow>
      </Section>
    </div>
  );
}

function SetupBadge({ data }: { data?: { step?: string; ok?: boolean } }) {
  if (!data) return <Badge variant="info">not started</Badge>;
  if (data.ok) return <Badge variant="success">complete ({data.step ?? '—'})</Badge>;
  return <Badge variant="warning">in progress ({data.step ?? '—'})</Badge>;
}

void Volume2;
void Label;