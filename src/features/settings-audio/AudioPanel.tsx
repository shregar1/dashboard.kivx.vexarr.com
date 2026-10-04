import { Mic, Volume2, Languages } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig, useMediaPermissions } from '@/api/queries';
import { ipc } from '@/lib/ipc';

export function AudioPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const media = useMediaPermissions();

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Microphone"
        description="KivX transcribes your answers locally when possible. Mic access is needed only while a session is active."
      >
        <SectionRow
          label="Auto-listen"
          description="Automatically transcribe the mic while a session is running."
        >
          <Switch
            checked={Boolean(config.data?.autoCycleListen)}
            onCheckedChange={(v) => setConfig.mutate({ autoCycleListen: v })}
          />
        </SectionRow>

        <SectionRow label="Mic permission" description="Granted by macOS / Windows when the session starts.">
          <PermissionBadge state={(media.data as { microphone?: string } | undefined)?.microphone} />
        </SectionRow>

        <SectionRow label="System audio source" description="Loopback device for capturing the interviewer.">
          <Input
            value={config.data?.sysAudioSource ?? ''}
            placeholder="BlackHole 2ch"
            onChange={(e) => setConfig.mutate({ sysAudioSource: e.target.value })}
            className="w-64"
          />
        </SectionRow>

        <SectionRow label="Open mic settings" description="Grant KivX the OS-level mic permission.">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Mic className="size-3.5" />}
            onClick={() => ipc.openScreenRecordingSettings()}
          >
            Open settings
          </Button>
        </SectionRow>
      </Section>

      <Section
        title="Translation"
        description="Translate the interviewer's questions (or your answers) in real time."
      >
        <SectionRow label="Enabled" description="Overlay renders translated text alongside the original.">
          <Switch
            checked={Boolean(config.data?.translation?.enabled)}
            onCheckedChange={(v) =>
              setConfig.mutate({ translation: { ...config.data?.translation, enabled: v } })
            }
          />
        </SectionRow>

        <SectionRow label="Translate questions" description="Show the interviewer's question in your native language.">
          <Switch
            checked={Boolean(config.data?.translation?.translateQuestions)}
            onCheckedChange={(v) =>
              setConfig.mutate({
                translation: { ...config.data?.translation, translateQuestions: v }
              })
            }
          />
        </SectionRow>

        <SectionRow label="Translate answers" description="Show your answer back-translated before you send it.">
          <Switch
            checked={Boolean(config.data?.translation?.translateAnswers)}
            onCheckedChange={(v) =>
              setConfig.mutate({
                translation: { ...config.data?.translation, translateAnswers: v }
              })
            }
          />
        </SectionRow>

        <SectionRow label="Native language" description="Your language. Questions will be translated into this.">
          <Select
            value={config.data?.translation?.nativeLanguage ?? 'en'}
            onChange={(e) =>
              setConfig.mutate({
                translation: { ...config.data?.translation, nativeLanguage: e.target.value }
              })
            }
            className="w-48"
          >
            {['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'hi', 'ru', 'ar'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </SectionRow>

        <SectionRow label="Interview language" description="The language the interviewer is speaking.">
          <Select
            value={config.data?.translation?.interviewLanguage ?? 'en'}
            onChange={(e) =>
              setConfig.mutate({
                translation: { ...config.data?.translation, interviewLanguage: e.target.value }
              })
            }
            className="w-48"
          >
            {['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'hi', 'ru', 'ar'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </SectionRow>
      </Section>
    </div>
  );
}

function PermissionBadge({ state }: { state?: string }) {
  if (state === 'granted') return <Badge variant="success">granted</Badge>;
  if (state === 'denied') return <Badge variant="destructive">denied</Badge>;
  return <Badge variant="warning">unknown</Badge>;
}

// keep used icons referenced
void Volume2;
void Languages;
void Label;