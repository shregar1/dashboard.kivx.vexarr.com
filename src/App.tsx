import { createRouter, RouterProvider } from '@tanstack/react-router';

import { queryClient } from '@/lib/query-client';
import { Route as RootRoute } from '@/routes/__root';
import { Route as IndexRoute } from '@/routes/index';
import { Route as SigninRoute } from '@/routes/signin';
import { Route as AuthedRoute } from '@/routes/_authed';
import { Route as SettingsRoute } from '@/routes/settings/route';
import { Route as SettingsIndexRoute } from '@/routes/settings/index';
import { Route as SettingsLlmRoute } from '@/routes/settings/llm';
import { Route as SettingsAudioRoute } from '@/routes/settings/audio';
import { Route as SettingsSttRoute } from '@/routes/settings/stt';
import { Route as SettingsHotkeysRoute } from '@/routes/settings/hotkeys';
import { Route as SettingsDataRoute } from '@/routes/settings/data';
// import { Route as SettingsCameraRoute } from '@/routes/settings/camera';
// Virtual camera is disabled for now — the route file still exists
// but isn't wired into the router. Uncomment to bring it back.
import { Route as SessionsRoute } from '@/routes/sessions/route';
import { Route as SessionsIndexRoute } from '@/routes/sessions/index';
import { Route as SessionDetailRoute } from '@/routes/sessions/$urn';
import { Route as PersonalityRoute } from '@/routes/personality/route';
import { Route as PersonalityIndexRoute } from '@/routes/personality/index';
import { Route as PersonalityOverviewRoute } from '@/routes/personality/overview';
import { Route as PersonalityDimensionsRoute } from '@/routes/personality/dimensions';
import { Route as PersonalityRulesRoute } from '@/routes/personality/do-dont';
import { Route as DiagnosticsRoute } from '@/routes/diagnostics/index';
import { Route as BugReportRoute } from '@/routes/diagnostics/bug-report';

const routeTree = RootRoute.addChildren([
  SigninRoute,
  AuthedRoute.addChildren([
    IndexRoute,
    SettingsRoute.addChildren([
      SettingsIndexRoute,
      SettingsLlmRoute,
      SettingsAudioRoute,
      SettingsSttRoute,
      SettingsHotkeysRoute,
      SettingsDataRoute
    ]),
    SessionsRoute.addChildren([SessionsIndexRoute, SessionDetailRoute]),
    PersonalityRoute.addChildren([
      PersonalityIndexRoute,
      PersonalityOverviewRoute,
      PersonalityDimensionsRoute,
      PersonalityRulesRoute
    ]),
    DiagnosticsRoute.addChildren([BugReportRoute])
  ])
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient
  }
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} context={{ queryClient }} />;
}

void queryClient;