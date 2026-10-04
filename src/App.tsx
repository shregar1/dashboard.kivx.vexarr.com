import { createRouter, RouterProvider } from '@tanstack/react-router';

import { queryClient } from '@/lib/query-client';
import { Route as RootRoute } from '@/routes/__root';
import { Route as IndexRoute } from '@/routes/index';
import { Route as SigninRoute } from '@/routes/signin';
import { Route as AuthedRoute } from '@/routes/_authed';
import { Route as SettingsRoute } from '@/routes/settings/route';
import { Route as SettingsLlmRoute } from '@/routes/settings/llm';
import { Route as SettingsAudioRoute } from '@/routes/settings/audio';
import { Route as SettingsSttRoute } from '@/routes/settings/stt';
import { Route as SettingsTtsRoute } from '@/routes/settings/tts';
import { Route as SettingsHotkeysRoute } from '@/routes/settings/hotkeys';
import { Route as SettingsPromptsRoute } from '@/routes/settings/prompts';
import { Route as SettingsDataRoute } from '@/routes/settings/data';
import { Route as SettingsCameraRoute } from '@/routes/settings/camera';
import { Route as SettingsTelemetryRoute } from '@/routes/settings/telemetry';
import { Route as SessionsRoute } from '@/routes/sessions/route';
import { Route as SessionsIndexRoute } from '@/routes/sessions/index';
import { Route as SessionDetailRoute } from '@/routes/sessions/$urn';
import { Route as PersonalityRoute } from '@/routes/personality/index';
import { Route as DiagnosticsRoute } from '@/routes/diagnostics/index';
import { Route as BugReportRoute } from '@/routes/diagnostics/bug-report';
import { Route as ProcessesRoute } from '@/routes/diagnostics/processes';

const routeTree = RootRoute.addChildren([
  SigninRoute,
  AuthedRoute.addChildren([
    IndexRoute,
    SettingsRoute.addChildren([
      SettingsLlmRoute,
      SettingsAudioRoute,
      SettingsSttRoute,
      SettingsTtsRoute,
      SettingsHotkeysRoute,
      SettingsPromptsRoute,
      SettingsDataRoute,
      SettingsCameraRoute,
      SettingsTelemetryRoute
    ]),
    SessionsRoute.addChildren([SessionsIndexRoute, SessionDetailRoute]),
    PersonalityRoute,
    DiagnosticsRoute.addChildren([BugReportRoute, ProcessesRoute])
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