import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUi, type Theme } from '@/stores/ui-store';
import { ipc } from '@/lib/ipc';
import { cn } from '@/lib/utils';

const THEME_CYCLE: Array<{ value: Theme; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: MonitorSmartphone, label: 'System' }
];

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
    </div>
  );
}

/**
 * Single-button theme cycle. Click → light → dark → system → light …
 * The icon shows the *current* mode; aria-label reflects the *next*
 * mode the click will select, which doubles as the tooltip.
 */
function ThemeToggle({ theme, onTheme }: { theme: Theme; onTheme: (t: Theme) => void }) {
  const currentIdx = THEME_CYCLE.findIndex((t) => t.value === theme);
  const current = THEME_CYCLE[currentIdx] ?? THEME_CYCLE[0];
  const next = THEME_CYCLE[(currentIdx + 1) % THEME_CYCLE.length];
  const Icon = current.icon;
  return (
    <button
      type="button"
      aria-label={`Theme: ${current.label} (click for ${next.label})`}
      title={`Theme: ${current.label}`}
      onClick={() => onTheme(next.value)}
      className="inline-flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Icon className="size-4" />
    </button>
  );
}