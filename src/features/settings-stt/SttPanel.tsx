import { Wand2, KeyRound, Languages } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig } from '@/api/queries';
import { ipc } from '@/lib/ipc';

const ENGINES = [
  { value: 'apple', label: 'Apple on-device' },
  { value: 'whisper', label: 'Whisper (OpenAI)' },
  { value: 'whisper-local', label: 'Whisper (local)' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'parakeet', label: 'Parakeet' }
] as const;

export function SttPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const engine = config.data?.stt?.engine ?? 'apple';

  return (
    <Section
      title="Speech-to-text"
      description="Choose the speech-to-text backend used to transcribe the interview."
    >
      <SectionRow label="Engine" description="Defaults to on-device if available.">
        <Select
          value={engine}
          onChange={(e) =>
            setConfig.mutate({
              stt: { ...config.data?.stt, engine: e.target.value as never }
            })
          }
          className="w-64"
        >
          {ENGINES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </Select>
      </SectionRow>

      <SectionRow label="Language" description="BCP-47 tag (en, es, fr, …). Empty = auto-detect.">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-muted-foreground" />
          <Input
            value={config.data?.stt?.language ?? ''}
            placeholder="auto"
            onChange={(e) =>
              setConfig.mutate({ stt: { ...config.data?.stt, language: e.target.value } })
            }
            className="w-32"
          />
        </div>
      </SectionRow>

      {(engine === 'whisper' || engine === 'whisper-local') && (
        <SectionRow label="Whisper API key" description="Required for the OpenAI Whisper API; ignored by local mode.">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="off"
              value={config.data?.stt?.whisperApiKey ?? ''}
              placeholder="sk-…"
              onChange={(e) =>
                setConfig.mutate({
                  stt: { ...config.data?.stt, whisperApiKey: e.target.value }
                })
              }
              className="w-72"
            />
          </div>
        </SectionRow>
      )}

      {(engine === 'whisper' || engine === 'whisper-local') && (
        <SectionRow label="Whisper model" description="Defaults to whisper-1 for the API.">
          <Input
            value={config.data?.stt?.whisperModel ?? ''}
            placeholder="whisper-1"
            onChange={(e) =>
              setConfig.mutate({ stt: { ...config.data?.stt, whisperModel: e.target.value } })
            }
            className="w-64"
          />
        </SectionRow>
      )}

      {engine === 'elevenlabs' && (
        <SectionRow label="ElevenLabs API key" description="Used for transcription through ElevenLabs.">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="off"
              value={config.data?.stt?.elevenLabsApiKey ?? ''}
              placeholder="xi-api-key…"
              onChange={(e) =>
                setConfig.mutate({
                  stt: { ...config.data?.stt, elevenLabsApiKey: e.target.value }
                })
              }
              className="w-72"
            />
          </div>
        </SectionRow>
      )}

      {engine === 'elevenlabs' && (
        <SectionRow label="ElevenLabs model" description="Defaults to scribe_v1.">
          <Input
            value={config.data?.stt?.elevenLabsModel ?? ''}
            placeholder="scribe_v1"
            onChange={(e) =>
              setConfig.mutate({ stt: { ...config.data?.stt, elevenLabsModel: e.target.value } })
            }
            className="w-64"
          />
        </SectionRow>
      )}

      <SectionRow label="Status" description="Re-run the auto-config wizard for STT setup.">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Wand2 className="size-3.5" />}
          onClick={() => ipc.openExternal('kivx://stt-setup')}
        >
          Run setup
        </Button>
      </SectionRow>

      <SectionRow label="Engine badge" description="Quick visual indicator for the current engine.">
        <Badge variant="info">{ENGINES.find((e) => e.value === engine)?.label ?? engine}</Badge>
      </SectionRow>
    </Section>
  );
}