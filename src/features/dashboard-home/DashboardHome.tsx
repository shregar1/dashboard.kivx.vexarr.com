import { Link, useNavigate } from '@tanstack/react-router';
import {
  Sparkles,
  History,
  Activity,
  Settings2,
  Cpu,
  ArrowRight,
  Mic,
  AudioLines,
  Bot,
  ChevronRight,
  FileText,
  Bug
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/shared/section';

import { useConfig, useSessions, usePersonality, useDiagnostics } from '@/api/queries';
import { useProfile } from '@/stores/profile-store';
import { useUi } from '@/stores/ui-store';
import { formatRelativeTime, truncate } from '@/lib/utils';

export function DashboardHome() {
  const config = useConfig();
  const sessions = useSessions();
  const personality = usePersonality();
  const diagnostics = useDiagnostics();
  const profile = useProfile((s) => s.profile);
  const isAuthed = useProfile((s) => s.isAuthenticated);
  const setDevMode = useUi((s) => s.setDevMode);
  const navigate = useNavigate();

  const activeProvider = config.data?.activeProvider;
  const responseMode = config.data?.responseMode ?? 'auto';
  const sessionCount = sessions.data?.length ?? 0;
  const recent = (sessions.data ?? []).slice(0, 4);

  const personalityData = personality.data as
    | { derivedFromSessions?: number; summary?: string; dimensions?: { tone?: string } }
    | undefined;
  const derived = personalityData?.derivedFromSessions ?? 0;

  const snap = diagnostics.data as { platform?: string; arch?: string } | undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Welcome strip ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAuthed && profile.displayName !== 'Guest' && profile.displayName !== 'Signed out'
              ? `Welcome back, ${profile.displayName.split(' ')[0]}`
              : 'Welcome to KivX'}
          </h1>
          <Badge variant="outline">{profile.plan === 'free' ? 'Free' : profile.plan}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Your interview co-pilot. Configure providers, review sessions, and tune the
          personality profile — all from one place.
        </p>
      </div>

      {/* ── Top KPI strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<Bot className="size-3.5" />}
          label="Active provider"
          value={activeProvider ?? '—'}
          hint={responseMode}
        />
        <KpiCard
          icon={<History className="size-3.5" />}
          label="Sessions"
          value={`${sessionCount}`}
          hint={sessionCount === 0 ? 'none yet' : 'recorded'}
        />
        <KpiCard
          icon={<Sparkles className="size-3.5" />}
          label="Personality"
          value={`${derived}`}
          hint={derived === 0 ? 'no feedback yet' : `${derived} submission${derived === 1 ? '' : 's'}`}
        />
        <KpiCard
          icon={<Activity className="size-3.5" />}
          label="Host"
          value={snap?.platform ?? '—'}
          hint={snap?.arch ?? ''}
        />
      </div>

      {/* ── Quick actions + Recent sessions ────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border p-4">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>The four things you'll do most.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 p-4">
            <QuickLink to="/settings/llm" icon={<Settings2 className="size-3.5" />} label="LLM providers" />
            <QuickLink to="/settings/audio" icon={<Mic className="size-3.5" />} label="Audio" />
            <QuickLink to="/settings/stt" icon={<AudioLines className="size-3.5" />} label="Speech-to-text" />
            <QuickLink to="/settings/hotkeys" icon={<Cpu className="size-3.5" />} label="Hotkeys" />
            <QuickLink to="/settings/prompts" icon={<FileText className="size-3.5" />} label="Prompts" />
            <QuickLink to="/personality" icon={<Sparkles className="size-3.5" />} label="Personality" />
            <QuickLink to="/diagnostics" icon={<Activity className="size-3.5" />} label="Diagnostics" />
            <QuickLink to="/diagnostics/bug-report" icon={<Bug className="size-3.5" />} label="Report a bug" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-4">
            <div>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>Last 4 interviews</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="size-3" />}
              onClick={() => navigate({ to: '/sessions' })}
            >
              All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <History className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No sessions yet</p>
                <p className="text-xs text-muted-foreground">
                  Start a session in the desktop overlay to record your first one.
                </p>
              </div>
            ) : (
              <ul>
                {recent.map((s) => (
                  <li key={s.urn}>
                    <Link
                      to="/sessions/$urn"
                      params={{ urn: s.urn }}
                      className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0 transition-colors hover:bg-secondary"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {truncate(s.summary, 60) || truncate(s.jdSnippet, 60) || `Session ${s.id.slice(0, 8)}`}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                          <span>{formatRelativeTime(s.startedAt)}</span>
                          <span>·</span>
                          <span>{s.turnCount} turns</span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Personality at a glance ──────────────────────────────────── */}
      <Section
        title="Personality"
        description="The user-style profile that gets injected into every LLM prompt."
      >
        {derived === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <Sparkles className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No profile yet</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Submit feedback after a few sessions and the engine will build a style profile that
              matches your preferences.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => navigate({ to: '/personality' })}
            >
              Open personality →
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">tone · {personalityData?.dimensions?.tone ?? 'neutral'}</Badge>
              <span className="text-xs text-muted-foreground">
                {derived} feedback submission{derived === 1 ? '' : 's'}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              rightIcon={<ArrowRight className="size-3" />}
              onClick={() => navigate({ to: '/personality' })}
            >
              View profile
            </Button>
          </div>
        )}
      </Section>

      {/* Dev mode trigger (only when no dev tools visible) — adds the
          processes + bug-report entries to the sidebar. */}
      {!useUi.getState().devMode && (
        <div className="border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Power user?{' '}
            <button
              type="button"
              onClick={() => setDevMode(true)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Enable dev mode
            </button>{' '}
            to surface processes and bug-report shortcuts in the sidebar.
          </p>
        </div>
      )}
    </div>
  );
}

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

function QuickLink({
  to,
  icon,
  label
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex h-9 items-center justify-between border border-border bg-card px-3 text-sm transition-colors hover:bg-secondary"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ArrowRight className="size-3.5 text-muted-foreground" />
    </Link>
  );
}