import { createRoute, Outlet, useLocation, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  Settings2,
  Volume2,
  Keyboard,
  Database,
  Mic,
  Activity,
  History,
  Sparkles
} from 'lucide-react';

import { Route as RootRoute } from '@/routes/__root';
import { PageNavProvider, type NavItem } from '@/components/layout/page-nav-context';
import { Shell } from '@/components/layout/shell';
import { useProfile } from '@/stores/profile-store';

const SETTINGS_NAV: NavItem[] = [
  { to: '/settings/llm', label: 'LLM providers', icon: Settings2 },
  { to: '/settings/audio', label: 'Audio', icon: Volume2 },
  { to: '/settings/stt', label: 'Speech-to-text', icon: Mic },
  { to: '/settings/hotkeys', label: 'Hotkeys', icon: Keyboard },
  { to: '/settings/data', label: 'Data', icon: Database }
];

// Sessions and Personality are single-page destinations, not
// sections with sub-pages. They share the global Workspace nav
// (personality has internal tabs, sessions has the in-page search).

const DIAGNOSTICS_NAV: NavItem[] = [
  { to: '/diagnostics', label: 'Status', icon: Activity }
];

// (Report a bug was moved to the profile menu — see profile-menu.tsx.)

const HOME_NAV: NavItem[] = [
  { to: '/sessions', label: 'Sessions', icon: History },
  { to: '/personality', label: 'Personality', icon: Sparkles },
  { to: '/diagnostics', label: 'Diagnostics', icon: Activity }
];

function useNavForCurrentPath(pathname: string): { title: string; items: NavItem[] } {
  if (pathname.startsWith('/settings')) {
    return { title: 'Settings', items: SETTINGS_NAV };
  }
  if (pathname.startsWith('/diagnostics')) {
    return { title: 'Diagnostics', items: DIAGNOSTICS_NAV };
  }
  // /sessions, /personality and the home dashboard share the global
  // Workspace nav — both are single-page destinations, not sections
  // with sub-pages (personality has internal tabs instead).
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
  // Subscribe to the raw pathname — useRouter's state is stable and
  // the router re-renders this component when the route changes, so
  // a plain string read is enough. (Wrapping it in `useLocation({ select })`
  // with a fresh object literal causes the select function to return a
  // new reference every render, which the router treats as a change
  // and re-fires → infinite redirect loop.)
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