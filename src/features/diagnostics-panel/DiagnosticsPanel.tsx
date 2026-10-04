import { useState } from 'react';
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

import {
  useDiagnostics,
  useLogInfo,
  useUpdateStatus,
  useCheckForUpdates,
  useCompanionStatus
} from '@/api/queries';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';
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
        session?: { active: boolean; paused?: boolean; autoListening?: boolean; sessionId?: string; startedAt?: number };
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<SettingsIcon className="size-4" />} label="Platform" value={snap?.platform ?? '—'} hint={snap?.arch ?? ''} />
        <KpiCard icon={<Cpu className="size-4" />} label="CPU" value={snap?.cpu?.model ?? '—'} hint={snap?.cpu?.cores ? `${snap.cpu.cores} cores` : ''} />
        <KpiCard icon={<MemoryStick className="size-4" />} label="Memory (RSS)" value={snap ? formatBytes(snap.memory?.rss) : '—'} hint={snap ? `heap ${formatBytes(snap.memory?.heapUsed)} / ${formatBytes(snap.memory?.heapTotal)}` : ''} />
        <KpiCard
          icon={<Activity className="size-4" />}
          label="Session"
          value={snap?.session?.active ? 'active' : 'idle'}
          hint={snap?.session?.active && snap?.session.startedAt ? formatRelativeTime(snap.session.startedAt) : ''}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
          <CardDescription>App + native + Electron versions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {snap?.versions &&
            Object.entries(snap.versions).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{String(v)}</span>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>macOS / Windows mic + screen capture</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="size-3.5" />}
            onClick={() => diag.refetch()}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PermissionRow icon={<Mic className="size-4" />} label="Microphone" state={snap?.mediaPermissions?.microphone} />
          <PermissionRow icon={<ScreenShare className="size-4" />} label="Screen capture" state={snap?.mediaPermissions?.screen} />
          {snap?.mediaPermissions?.accessibility && (
            <PermissionRow icon={<KeyRound className="size-4" />} label="Accessibility" state={snap.mediaPermissions.accessibility} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Windows</CardTitle>
          <CardDescription>The BrowserWindow instances the desktop currently has open</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {(snap?.windows ?? []).map((w, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono">{w.name}</span>
                <div className="flex items-center gap-2">
                  {w.focused && <Badge variant="success">focused</Badge>}
                  <Badge variant={w.visible ? 'info' : 'warning'}>{w.visible ? 'visible' : 'hidden'}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {snap?.hotPaths && snap.hotPaths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hot paths</CardTitle>
            <CardDescription>Sampled latency across the request pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">label</th>
                  <th className="py-2 pr-3 font-medium">p50</th>
                  <th className="py-2 pr-3 font-medium">p95</th>
                  <th className="py-2 font-medium">count</th>
                </tr>
              </thead>
              <tbody>
                {snap.hotPaths.map((h, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-mono">{h.label}</td>
                    <td className="py-2 pr-3">{formatDuration(h.p50Ms)}</td>
                    <td className="py-2 pr-3">{formatDuration(h.p95Ms)}</td>
                    <td className="py-2">{h.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <CardDescription>File transport (JSONL, rotated)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
              {logInfo?.path ?? '—'}
              {logInfo?.sizeBytes !== undefined && (
                <span className="ml-2 text-muted-foreground">({formatBytes(logInfo.sizeBytes)})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FolderOpen className="size-3.5" />}
                onClick={() => ipc.openLogs()}
              >
                Reveal in Finder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download className="size-3.5" />}
                onClick={() => toast({ variant: 'info', title: 'Use Reveal in Finder, then copy the log file.' })}
              >
                How to attach
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updates</CardTitle>
            <CardDescription>Auto-update via electron-updater</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <UpdateIcon state={updateStatus?.state} />
              <span className="text-sm">
                {updateStatus?.state === 'available' && `Update ${updateStatus.version} available`}
                {updateStatus?.state === 'not-available' && 'Up to date'}
                {updateStatus?.state === 'downloading' && `Downloading ${updateStatus.version}…`}
                {updateStatus?.state === 'downloaded' && `Update ${updateStatus.version} ready to install`}
                {updateStatus?.state === 'checking' && 'Checking…'}
                {updateStatus?.state === 'error' && `Error: ${updateStatus.error}`}
                {!updateStatus && 'Unknown'}
              </span>
            </div>
            {updateStatus?.progress !== undefined && updateStatus.progress > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${updateStatus.progress * 100}%` }} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="size-3.5" />}
                onClick={() => checkUpdate.mutate(undefined)}
                loading={checkUpdate.isPending}
              >
                Check for updates
              </Button>
              {updateStatus?.state === 'downloaded' && (
                <Button
                  size="sm"
                  onClick={() => ipc.installUpdate()}
                >
                  Install + relaunch
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LAN companion</CardTitle>
          <CardDescription>Mobile control surface (phone.dashboard)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
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
          <div className="flex items-center gap-2">
            {companionStatus?.running ? (
              <Button variant="outline" size="sm" onClick={() => ipc.companionStop()}>
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={() => ipc.companionStart()}>
                Start
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report an issue</CardTitle>
          <CardDescription>Send a bug report to the KivX team — includes a snapshot and the last log lines.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/diagnostics/bug-report"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Bug className="size-4" />
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
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="mt-1 text-xl">{value}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
    </Card>
  );
}

function PermissionRow({ icon, label, state }: { icon: React.ReactNode; label: string; state?: string }) {
  const tone =
    state === 'granted' ? 'success' : state === 'denied' ? 'destructive' : 'warning';
  const label2 = state ?? 'unknown';
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <Badge variant={tone}>{label2}</Badge>
    </div>
  );
}

function UpdateIcon({ state }: { state?: string }) {
  if (state === 'available') return <Download className="size-4 text-primary" />;
  if (state === 'downloaded') return <CheckCircle2 className="size-4 text-success" />;
  if (state === 'error') return <AlertCircle className="size-4 text-destructive" />;
  return <CircleDashed className="size-4 text-muted-foreground" />;
}

void useState;