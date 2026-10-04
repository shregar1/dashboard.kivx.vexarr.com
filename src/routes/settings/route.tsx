import { createRoute, Outlet, Link } from '@tanstack/react-router';
import { Settings2, Volume2, Keyboard, FileText, Database, Camera, Mic, AudioLines, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Route as RootRoute } from '@/routes/__root';
import { PageContent } from '@/components/layout/page';

const SETTINGS_NAV = [
  { to: '/settings/llm', label: 'LLM providers', icon: Settings2 },
  { to: '/settings/audio', label: 'Audio', icon: Volume2 },
  { to: '/settings/stt', label: 'Speech-to-text', icon: Mic },
  { to: '/settings/tts', label: 'Text-to-speech', icon: AudioLines },
  { to: '/settings/hotkeys', label: 'Hotkeys', icon: Keyboard },
  { to: '/settings/prompts', label: 'Prompts', icon: FileText },
  { to: '/settings/data', label: 'Data', icon: Database },
  { to: '/settings/camera', label: 'Virtual camera', icon: Camera },
  { to: '/settings/telemetry', label: 'Telemetry', icon: Activity }
];

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'settings',
  component: SettingsLayout
});

function SettingsLayout() {
  return (
    <PageContent className="grid grid-cols-[220px_minmax(0,1fr)] gap-8">
      <aside>
        <nav className="sticky top-6 flex flex-col gap-0.5">
          {SETTINGS_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              activeProps={{ className: 'bg-accent text-foreground font-medium' }}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </PageContent>
  );
}