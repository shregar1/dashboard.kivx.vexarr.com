import { createRoute, Outlet, redirect } from '@tanstack/react-router';

import { Route as RootRoute } from '@/routes/__root';
import { Shell } from '@/components/layout/shell';
import { useProfile } from '@/stores/profile-store';

/**
 * Layout for every route that needs the shell (sidebar, topbar, profile
 * menu). When the profile is hydrated and the user isn't signed in,
 * we redirect to /signin. Hydration races the localStorage read on
 * first load — we render a blank background while it settles to
 * avoid flashing the auth screen on already-signed-in users.
 */
export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: '_authed',
  beforeLoad: () => {
    // Hydration is async (zustand persist); the auth gate inside
    // this route handles the post-hydration bounce. The `beforeLoad`
    // here is a no-op so a server-side render doesn't crash.
  },
  component: AuthedLayout
});

function AuthedLayout() {
  const hydrated = useProfile((s) => s.hydrated);
  const isAuthed = useProfile((s) => s.isAuthenticated);

  if (!hydrated) {
    return <div className="h-screen w-screen bg-background" />;
  }

  if (!isAuthed) {
    // Lazy-redirect so the user lands on /signin. We use the router
    // here rather than TanStack's `redirect` so we don't run a full
    // navigation during the first render.
    return <SigninRedirect />;
  }

  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

function SigninRedirect() {
  const router = useRouter();
  useEffect(() => {
    void router.navigate({ to: '/signin', replace: true });
  }, [router]);
  return <div className="h-screen w-screen bg-background" />;
}