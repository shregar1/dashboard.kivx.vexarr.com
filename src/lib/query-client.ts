import { QueryClient } from '@tanstack/react-query';

import { ipc } from './ipc';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dashboard traffic is local LAN — a long stale window keeps the
      // UI snappy. Mutations are the source of truth.
      staleTime: 5_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});

export const queryKeys = {
  config: ['config'] as const,
  sessions: (limit?: number) => ['sessions', limit ?? 'all'] as const,
  session: (urn: string) => ['session', urn] as const,
  orphans: ['sessions', 'orphans'] as const,
  search: (q: string) => ['sessions', 'search', q] as const,
  personality: ['personality'] as const,
  personalityFormatted: ['personality', 'formatted'] as const,
  feedback: (sessionId: string) => ['feedback', sessionId] as const,
  diagnostics: ['diagnostics'] as const,
  logInfo: ['log-info'] as const,
  updateStatus: ['update', 'status'] as const,
  stealthPresets: ['stealth', 'presets'] as const,
  companion: ['companion', 'status'] as const,
  mediaPermissions: ['permissions', 'media'] as const,
  ttsConfig: ['tts', 'config'] as const,
  ttsSetupStatus: ['tts', 'setup-status'] as const,
  vcamConfig: ['vcam', 'config'] as const,
  vcamStatus: ['vcam', 'status'] as const,
  probes: (providerId: string) => ['probe', providerId] as const
};

// ── Health probe — used by the topbar "Connected" indicator ────────────

export async function checkConnection(): Promise<boolean> {
  try {
    await ipc.getSessionState();
    return true;
  } catch {
    return false;
  }
}