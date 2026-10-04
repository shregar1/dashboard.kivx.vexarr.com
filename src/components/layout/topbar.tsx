import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, MonitorSmartphone, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUi, type Theme } from '@/stores/ui-store';
import { ipc } from '@/lib/ipc';
import { cn } from '@/lib/utils';

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        <ConnectionPill connected={connected} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          v0.1.0
        </span>
      </div>

      <div className="flex items-center gap-1.5">
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
  const label = connected === null ? 'Connecting' : connected ? 'Connected' : 'Offline';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'inline-block size-1.5 rounded-full',
          connected === null
            ? 'bg-muted-foreground animate-pulse'
            : connected
              ? 'bg-success'
              : 'bg-destructive'
        )}
      />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">to KivX host</span>
    </div>
  );
}

function ThemeToggle({ theme, onTheme }: { theme: Theme; onTheme: (t: Theme) => void }) {
  return (
    <div className="inline-flex h-8 items-center border border-border">
      {(['dark', 'light', 'system'] as const).map((t, i) => {
        const Icon = t === 'dark' ? Moon : t === 'light' ? Sun : MonitorSmartphone;
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            aria-label={`Theme: ${t}`}
            onClick={() => onTheme(t)}
            className={cn(
              'inline-flex h-full w-7 items-center justify-center transition-colors',
              i > 0 && 'border-l border-border',
              active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// keep references
void Badge;