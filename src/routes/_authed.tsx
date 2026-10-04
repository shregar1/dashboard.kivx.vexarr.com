import { createRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import {
  Settings2,
  Volume2,
  Keyboard,
  Database,
  Camera,
  Mic,
  AudioLines,
  Activity,
  History,
  Search,
  Sparkles,
  Bug,
  Cpu,
  Plus
} from 'lucide-react';

import { Route as RootRoute } from '@/routes/__root';
import { PageNavProvider, type NavItem } from '@/components/layout/page-nav-context';
import { Shell } from '@/components/layout/shell';
import { useProfile } from '@/stores/profile-store';

const SETTINGS_NAV: NavItem[] = [
  { to: '/settings/llm', label: 'LLM providers', icon: Settings2 },
  { to: '/settings/audio', label: 'Audio', icon: Volume2 },
  { to: '/settings/stt', label: 'Speech-to-text', icon: Mic },
  { to: '/settings/tts', label: 'Text-to-speech', icon: AudioLines },
  { to: '/settings/hotkeys', label: 'Hotkeys', icon: Keyboard },
  { to: '/settings/data', label: 'Data', icon: Database },
  { to: '/settings/camera', label: 'Virtual camera', icon: Camera },
  { to: '/settings/telemetry', label: 'Telemetry', icon: Activity }
];

const SESSIONS_NAV: NavItem[] = [
  { to: '/sessions', label: 'All sessions', icon: History },
  { to: '/sessions', label: 'Search', icon: Search },
  { to: '/sessions', label: 'Orphans', icon: Plus }
];

const PERSONALITY_NAV: NavItem[] = [
  { to: '/personality', label: 'Overview', icon: Sparkles },
  { to: '/personality', label: 'Dimensions', icon: Activity },
  { to: '/personality', label: 'Do / Don\'t', icon: History }
];

const DIAGNOSTICS_NAV: NavItem[] = [
  { to: '/diagnostics', label: 'Status', icon: Activity },
  { to: '/diagnostics/processes', label: 'Processes', icon: Cpu },
  { to: '/diagnostics/bug-report', label: 'Bug report', icon: Bug, group: 'debug' }
];

const HOME_NAV: NavItem[] = [
  { to: '/sessions', label: 'Sessions', icon: History },
  { to: '/personality', label: 'Personality', icon: Sparkles },
  { to: '/diagnostics', label: 'Diagnostics', icon: Activity }
];

function useNavForCurrentPath(pathname: string): { title: string; items: NavItem[] } {
  if (pathname.startsWith('/settings')) {
    return { title: 'Settings', items: SETTINGS_NAV };
  }
  if (pathname.startsWith('/sessions')) {
    return { title: 'Sessions', items: SESSIONS_NAV };
  }
  if (pathname.startsWith('/personality')) {
    return { title: 'Personality', items: PERSONALITY_NAV };
  }
  if (pathname.startsWith('/diagnostics')) {
    return { title: 'Diagnostics', items: DIAGNOSTICS_NAV };
  }
  return { title: 'Workspace', items: HOME_NAV };
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: '_authed',
  component: AuthedLayout
});

function AuthedLayout() {
  const hydrated = useProfile((s) => s.hydrated);
  const isAuthed = useProfile((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const nav = useNavForCurrentPath(pathname);

  if (!hydrated) {
    return <div className="h-screen w-screen bg-background" />;
  }

  if (!isAuthed) {
    return <SigninRedirect />;
  }

  return (
    <PageNavProvider title={nav.title} items={nav.items}>
      <Shell>
        <Outlet />
      </Shell>
    </PageNavProvider>
  );
}

function SigninRedirect() {
  const router = useRouter();
  useEffect(() => {
    void router.navigate({ to: '/signin', replace: true });
  }, [router]);
  return <div className="h-screen w-screen bg-background" />;
}