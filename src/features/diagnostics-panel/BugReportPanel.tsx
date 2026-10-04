import { useState } from 'react';
import { Bug, Send, Save, Mail, FileJson } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useBugReport, useSaveBugReport, useDiagnostics, useLogInfo } from '@/api/queries';
import { bugReportInputSchema } from '@/schemas/diagnostics';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';
import { formatBytes, formatDateTime } from '@/lib/utils';

export function BugReportPanel() {
  const diag = useDiagnostics();
  const log = useLogInfo();
  const submit = useBugReport();
  const saveReport = useSaveBugReport();

  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeSnapshot, setIncludeSnapshot] = useState(true);

  function buildInput() {
    return bugReportInputSchema.parse({
      description: description.trim(),
      email: email.trim() || '',
      includeLogs,
      includeSnapshot
    });
  }

  async function send() {
    const parsed = bugReportInputSchema.safeParse({
      description: description.trim(),
      email: email.trim() || '',
      includeLogs,
      includeSnapshot
    });
    if (!parsed.success) {
      toast({ variant: 'error', title: 'Please describe the issue first.' });
      return;
    }
    try {
      const res = (await submit.mutateAsync(parsed.data)) as { ok: boolean; reportId?: string; error?: string };
      if (res.ok) toast({ variant: 'success', title: `Report ${res.reportId} sent` });
      else toast({ variant: 'error', title: 'Submit failed', description: res.error });
    } catch (e) {
      toast({ variant: 'error', title: 'Submit failed', description: String(e) });
    }
  }

  async function saveLocal() {
    const input = buildInput();
    try {
      await saveReport.mutateAsync(input);
      toast({ variant: 'success', title: 'Saved report to disk' });
    } catch (e) {
      toast({ variant: 'error', title: 'Save failed', description: String(e) });
    }
  }

  function openEmail() {
    const body = `Description:\n${description}\n\n${includeLogs ? '(attached logs will be included)\n' : ''}`;
    void ipc.openSupportEmail({ subject: 'KivX bug report', body });
  }

  const logInfo = log.data as { path: string; sizeBytes?: number } | undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bug className="size-4" /> Bug report</CardTitle>
          <CardDescription>
            Send a snapshot + the relevant logs to the KivX team, or save the report locally to attach to email yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="bug-desc">What went wrong?</Label>
            <Textarea
              id="bug-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the steps to reproduce, when it happens, and what you expected."
              className="mt-1 min-h-[140px]"
            />
          </div>
          <div>
            <Label htmlFor="bug-email">Reply-to email (optional)</Label>
            <Input
              id="bug-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Include logs</p>
                <p className="text-xs text-muted-foreground">
                  {logInfo?.path ? `${formatBytes(logInfo.sizeBytes)}` : 'Unknown size'} — last 5 minutes scrubbed.
                </p>
              </div>
              <Switch checked={includeLogs} onCheckedChange={setIncludeLogs} />
            </div>
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Include snapshot</p>
                <p className="text-xs text-muted-foreground">Versions, permissions, windows, hot paths.</p>
              </div>
              <Switch checked={includeSnapshot} onCheckedChange={setIncludeSnapshot} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Mail className="size-3.5" />} onClick={openEmail}>
              Email instead
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Save className="size-3.5" />} onClick={saveLocal} loading={saveReport.isPending}>
              Save locally
            </Button>
            <Button size="sm" leftIcon={<Send className="size-3.5" />} onClick={send} loading={submit.isPending}>
              Send report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileJson className="size-4" /> Attached data</CardTitle>
          <CardDescription>What will be included in the report</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Row label="Snapshot captured" value={diag.dataUpdatedAt ? formatDateTime(diag.dataUpdatedAt) : '—'} />
          <Row label="Log file" value={logInfo?.path ?? '—'} />
          <Row label="Description length" value={`${description.length} chars`} />
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={description.length > 0 ? 'success' : 'warning'}>
              {description.length > 0 ? 'ready' : 'empty'}
            </Badge>
            <Badge variant={includeLogs ? 'info' : 'outline'}>logs {includeLogs ? 'on' : 'off'}</Badge>
            <Badge variant={includeSnapshot ? 'info' : 'outline'}>snapshot {includeSnapshot ? 'on' : 'off'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}