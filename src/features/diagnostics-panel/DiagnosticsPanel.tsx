import {
  Activity,
  Cpu,
  MemoryStick,
  Mic,
  ScreenShare,
  KeyRound,
  RefreshCw,
  FolderOpen,
  Download,
  Bug,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Section, SectionRow } from '@/components/shared/section';

import {
  useDiagnostics,
  useLogInfo,
  useUpdateStatus,
  useCheckForUpdates,
  useCompanionStatus
} from '@/api/queries';
import { ipc } from '@/lib/ipc';
import { formatBytes, formatDuration, formatRelativeTime } from '@/lib/utils';

export function DiagnosticsPanel() {
  const diag = useDiagnostics();
  const log = useLogInfo();
  const update = useUpdateStatus();
  const checkUpdate = useCheckForUpdates();
  const companion = useCompanionStatus();

  const snap = diag.data as
    | {
        capturedAt?: number;
        platform?: string;
        arch?: string;
        versions?: Record<string, string>;
        memory?: { rss: number; heapUsed: number; heapTotal: number; external: number };
        cpu?: { model?: string; cores?: number; loadAvg?: number[] };
        session?: {
          active: boolean;
          paused?: boolean;
          autoListening?: boolean;
          sessionId?: string;
          startedAt?: number;
        };
        windows?: Array<{ name: string; visible: boolean; focused?: boolean }>;
        mediaPermissions?: { microphone?: string; screen?: string; accessibility?: string };
        hotPaths?: Array<{ label: string; p50Ms: number; p95Ms: number; count: number }>;
      }
    | undefined;

  const logInfo = log.data as { path: string; sizeBytes?: number } | undefined;
  const updateStatus = update.data as
    | { state: string; version?: string; progress?: number; error?: string }
    | undefined;
  const companionStatus = companion.data as
    | { running: boolean; port?: number; url?: string }
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<SettingsIcon className="size-3.5" />}
          label="Platform"
          value={snap?.platform ?? '—'}
          hint={snap?.arch ?? ''}
        />
        <KpiCard
          icon={<Cpu className="size-3.5" />}
          label="CPU"
          value={snap?.cpu?.model ?? '—'}
          hint={snap?.cpu?.cores ? `${snap.cpu.cores} cores` : ''}
        />
        <KpiCard
          icon={<MemoryStick className="size-3.5" />}
          label="Memory"
          value={snap ? formatBytes(snap.memory?.rss) : '—'}
          hint={
            snap
              ? `heap ${formatBytes(snap.memory?.heapUsed)} / ${formatBytes(snap.memory?.heapTotal)}`
              : ''
          }
        />
        <KpiCard
          icon={<Activity className="size-3.5" />}
          label="Session"
          value={snap?.session?.active ? 'Active' : 'Idle'}
          hint={snap?.session?.active && snap?.session.startedAt ? formatRelativeTime(snap.session.startedAt) : ''}
        />
      </div>

      <Section
        title="Versions"
        description="App + native + Electron versions"
      >
        <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3">
          {snap?.versions &&
            Object.entries(snap.versions).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-2 border border-border bg-muted/20 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{String(v)}</span>
              </div>
            ))}
        </div>
      </Section>

      <Section
        title="Permissions"
        description="Microphone and screen capture status from the OS."
        footer={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="size-3" />}
            onClick={() => diag.refetch()}
          >
            Refresh
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-3">
          <PermissionRow
            icon={<Mic className="size-3.5" />}
            label="Microphone"
            state={snap?.mediaPermissions?.microphone}
          />
          <PermissionRow
            icon={<ScreenShare className="size-3.5" />}
            label="Screen capture"
            state={snap?.mediaPermissions?.screen}
          />
          {snap?.mediaPermissions?.accessibility && (
            <PermissionRow
              icon={<KeyRound className="size-3.5" />}
              label="Accessibility"
              state={snap.mediaPermissions.accessibility}
            />
          )}
        </div>
      </Section>

      <Section title="Windows" description="The BrowserWindow instances the desktop currently has open.">
        <ul>
          {(snap?.windows ?? []).map((w, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-b border-border p-3 text-sm last:border-b-0"
            >
              <span className="font-mono">{w.name}</span>
              <div className="flex items-center gap-1.5">
                {w.focused && <Badge variant="default">focused</Badge>}
                <Badge variant={w.visible ? 'info' : 'outline'}>
                  {w.visible ? 'visible' : 'hidden'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {snap?.hotPaths && snap.hotPaths.length > 0 && (
        <Section title="Hot paths" description="Sampled latency across the request pipeline.">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold uppercase tracking-wider">label</th>
                  <th className="px-4 py-2 font-semibold uppercase tracking-wider">p50</th>
                  <th className="px-4 py-2 font-semibold uppercase tracking-wider">p95</th>
                  <th className="px-4 py-2 font-semibold uppercase tracking-wider">count</th>
                </tr>
              </thead>
              <tbody>
                {snap.hotPaths.map((h, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-b-0">
                    <td className="px-4 py-2 font-mono">{h.label}</td>
                    <td className="px-4 py-2">{formatDuration(h.p50Ms)}</td>
                    <td className="px-4 py-2">{formatDuration(h.p95Ms)}</td>
                    <td className="px-4 py-2">{h.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Section
          title="Logs"
          description="File transport (JSONL, rotated)"
        >
          <SectionRow label="Path">
            <span className="font-mono text-xs text-muted-foreground">
              {logInfo?.path ?? '—'}
              {logInfo?.sizeBytes !== undefined && (
                <span className="ml-2">({formatBytes(logInfo.sizeBytes)})</span>
              )}
            </span>
          </SectionRow>
          <SectionRow label="Reveal in Finder" description="Open the logs directory.">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FolderOpen className="size-3.5" />}
              onClick={() => ipc.openLogs()}
            >
              Open
            </Button>
          </SectionRow>
        </Section>

        <Section title="Updates" description="Auto-update via electron-updater">
          <SectionRow label="Status">
            <div className="flex items-center gap-2">
              <UpdateIcon state={updateStatus?.state} />
              <span className="text-sm">
                {updateStatus?.state === 'available' && `Update ${updateStatus.version} available`}
                {updateStatus?.state === 'not-available' && 'Up to date'}
                {updateStatus?.state === 'downloading' && `Downloading ${updateStatus.version}…`}
                {updateStatus?.state === 'downloaded' && `Update ${updateStatus.version} ready`}
                {updateStatus?.state === 'checking' && 'Checking…'}
                {updateStatus?.state === 'error' && `Error: ${updateStatus.error}`}
                {!updateStatus && 'Unknown'}
              </span>
            </div>
          </SectionRow>
          {updateStatus?.progress !== undefined && updateStatus.progress > 0 && (
            <SectionRow label="Progress">
              <div className="h-1 w-48 bg-secondary">
                <div className="h-full bg-foreground" style={{ width: `${updateStatus.progress * 100}%` }} />
              </div>
            </SectionRow>
          )}
          <SectionRow label="Actions">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="size-3" />}
                onClick={() => checkUpdate.mutate(undefined)}
                loading={checkUpdate.isPending}
              >
                Check
              </Button>
              {updateStatus?.state === 'downloaded' && (
                <Button size="sm" onClick={() => ipc.installUpdate()}>
                  Install + relaunch
                </Button>
              )}
            </div>
          </SectionRow>
        </Section>
      </div>

      <Section title="LAN companion" description="Mobile control surface (phone.dashboard).">
        <SectionRow label="Status">
          <div className="flex items-center gap-2">
            <Badge variant={companionStatus?.running ? 'success' : 'warning'}>
              {companionStatus?.running ? 'running' : 'stopped'}
            </Badge>
            {companionStatus?.running && (
              <span className="font-mono text-xs text-muted-foreground">
                {companionStatus.url ?? `port ${companionStatus.port}`}
              </span>
            )}
          </div>
        </SectionRow>
        <SectionRow label="Action">
          {companionStatus?.running ? (
            <Button variant="outline" size="sm" onClick={() => ipc.companionStop()}>
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => ipc.companionStart()}>
              Start
            </Button>
          )}
        </SectionRow>
      </Section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="size-4" /> Report an issue
          </CardTitle>
          <CardDescription>
            Send a snapshot + the relevant logs to the KivX team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/diagnostics/bug-report"
            className="inline-flex h-8 items-center gap-2 border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Bug className="size-3.5" />
            Open bug report
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="gap-1.5 p-3">
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

function PermissionRow({ icon, label, state }: { icon: React.ReactNode; label: string; state?: string }) {
  const variant =
    state === 'granted' ? 'success' : state === 'denied' ? 'destructive' : 'warning';
  return (
    <div className="flex items-center justify-between gap-2 border border-border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <Badge variant={variant}>{state ?? 'unknown'}</Badge>
    </div>
  );
}

function UpdateIcon({ state }: { state?: string }) {
  if (state === 'available') return <Download className="size-3.5 text-foreground" />;
  if (state === 'downloaded') return <CheckCircle2 className="size-3.5 text-success" />;
  if (state === 'error') return <AlertCircle className="size-3.5 text-destructive" />;
  return <CircleDashed className="size-3.5 text-muted-foreground" />;
}