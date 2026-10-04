import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CircleDot, Moon, Sun, MonitorSmartphone, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUi, type Theme } from '@/stores/ui-store';
import { ipc } from '@/lib/ipc';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-client';

export function Topbar() {
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  const [connected, setConnected] = useState<boolean | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        await ipc.getSessionState();
        if (!cancelled) setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }
    ping();
    const id = window.setInterval(ping, 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex items-center gap-4">
        <ConnectionPill connected={connected} />
        <Badge variant="info" className="font-mono">
          v0.1.0
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh"
          onClick={() => {
            void qc.invalidateQueries();
          }}
        >
          <RefreshCw className="size-4" />
        </Button>

        <ThemeToggle theme={theme} onTheme={setTheme} />

        <Button
          variant="outline"
          size="sm"
          leftIcon={<ExternalLink className="size-3.5" />}
          onClick={() => {
            void ipc.openExternal('https://kivx.ai/docs');
          }}
        >
          Docs
        </Button>
      </div>
    </header>
  );
}

function ConnectionPill({ connected }: { connected: boolean | null }) {
  const label =
    connected === null ? 'Connecting…' : connected ? 'Connected' : 'Offline';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          connected === null
            ? 'bg-muted-foreground animate-pulse'
            : connected
              ? 'bg-success'
              : 'bg-destructive'
        )}
      />
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="text-muted-foreground">to KivX host</span>
    </div>
  );
}

function ThemeToggle({
  theme,
  onTheme
}: {
  theme: Theme;
  onTheme: (t: Theme) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-md border border-border bg-background p-0.5">
      {(['dark', 'light', 'system'] as const).map((t) => {
        const Icon = t === 'dark' ? Moon : t === 'light' ? Sun : MonitorSmartphone;
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            aria-label={`Theme: ${t}`}
            onClick={() => onTheme(t)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded transition-colors',
              active
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// Re-export the underlying hook so callers don't need to dig into lib.
export { queryKeys, CircleDot };