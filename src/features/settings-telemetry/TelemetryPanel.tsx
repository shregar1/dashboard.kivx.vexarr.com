import { Activity, BarChart3, ServerCog } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig } from '@/api/queries';

export function TelemetryPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const flags = config.data;
  if (!flags) return null;

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Telemetry"
        description="Anonymous usage telemetry and structured logs. Helps the team debug issues across the fleet. Disabled = nothing leaves your machine."
      >
        <SectionRow
          label="Enable telemetry"
          description="OTLP traces + metrics to the configured collector."
        >
          <Switch
            checked={Boolean(flags.enableTelemetry)}
            onCheckedChange={(v) => setConfig.mutate({ enableTelemetry: v })}
          />
        </SectionRow>

        <SectionRow
          label="Answer analysis"
          description="Local confidence + follow-up analysis on every LLM turn."
        >
          <Switch
            checked={Boolean(flags.enableAnswerAnalysis)}
            onCheckedChange={(v) => setConfig.mutate({ enableAnswerAnalysis: v })}
          />
        </SectionRow>
      </Section>

      <Section
        title="Stealth"
        description="Process tree / log / extension sanitisation that protects against proctoring software detecting KivX."
      >
        <SectionRow label="Process tree sanitise" description="Hide KivX-related processes from ps / tasklist.">
          <Switch
            checked={Boolean(flags.processTreeSanitize)}
            onCheckedChange={(v) => setConfig.mutate({ processTreeSanitize: v })}
          />
        </SectionRow>

        <SectionRow label="Log sanitise" description="Strip KivX identifiers from stdout logs.">
          <Switch
            checked={Boolean(flags.logSanitize)}
            onCheckedChange={(v) => setConfig.mutate({ logSanitize: v })}
          />
        </SectionRow>

        <SectionRow label="Extension scanner" description="Detect browser extensions that monitor the page.">
          <Switch
            checked={Boolean(flags.extensionScanner)}
            onCheckedChange={(v) => setConfig.mutate({ extensionScanner: v })}
          />
        </SectionRow>

        <SectionRow label="Proctoring scanner" description="Detect proctoring tools that might see your screen.">
          <Switch
            checked={Boolean(flags.proctoringScanner)}
            onCheckedChange={(v) => setConfig.mutate({ proctoringScanner: v })}
          />
        </SectionRow>

        <SectionRow label="Memory scrub" description="Periodically wipe clipboard + temp files.">
          <Switch
            checked={Boolean(flags.memoryScrub)}
            onCheckedChange={(v) => setConfig.mutate({ memoryScrub: v })}
          />
        </SectionRow>

        <SectionRow label="DNS leak protection" description="Route all KivX traffic through the proxy.">
          <Switch
            checked={Boolean(flags.dnsLeakProtection)}
            onCheckedChange={(v) => setConfig.mutate({ dnsLeakProtection: v })}
          />
        </SectionRow>

        <SectionRow label="Clipboard auto-wipe" description="Wipe the clipboard N seconds after typing.">
          <Switch
            checked={Boolean(flags.clipboardAutoWipe)}
            onCheckedChange={(v) => setConfig.mutate({ clipboardAutoWipe: v })}
          />
        </SectionRow>
      </Section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="size-4" /> Traces</CardTitle>
            <CardDescription>Span → collector pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={flags.enableTelemetry ? 'success' : 'warning'}>
              {flags.enableTelemetry ? 'sampling' : 'disabled'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="size-4" /> Metrics</CardTitle>
            <CardDescription>Process / latency / counter meters</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={flags.enableTelemetry ? 'success' : 'warning'}>
              {flags.enableTelemetry ? 'exporting' : 'disabled'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ServerCog className="size-4" /> Services</CardTitle>
            <CardDescription>Datadog / OTel / Splunk</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="info">configured by env</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}