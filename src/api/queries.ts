import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query';

import { ipc } from '@/lib/ipc';
import { queryKeys } from '@/lib/query-client';
import type { FullConfig, ConfigPatch } from '@/schemas/config';
import {
  deleteAllResultSchema,
  exportMarkdownResultSchema,
  sessionListEntrySchema,
  sessionRecordSchema,
  sessionSearchHitSchema,
  sessionOrphanSchema,
  importOneResultSchema,
  importManyResultSchema,
  exportJsonResultSchema
} from '@/schemas/session';
import type { z } from 'zod';

// ── Config ─────────────────────────────────────────────────────────────

export function useConfig(): UseQueryResult<FullConfig> {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => ipc.getConfig()
  });
}

export function useSetConfig(): UseMutationResult<unknown, Error, ConfigPatch> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => ipc.setConfig(patch),
    onSuccess: (next) => {
      // Server returns the merged config — cache it directly.
      qc.setQueryData(queryKeys.config, next);
    }
  });
}

// ── Sessions ───────────────────────────────────────────────────────────

export function useSessions(limit = 500): UseQueryResult<z.infer<typeof sessionListEntrySchema>[]> {
  return useQuery({
    queryKey: queryKeys.sessions(limit),
    queryFn: async () => {
      const rows = (await ipc.listSessions(limit)) as z.infer<typeof sessionListEntrySchema>[];
      return rows.map((r) => sessionListEntrySchema.parse(r));
    }
  });
}

export function useSession(
  urn: string | undefined
): UseQueryResult<z.infer<typeof sessionRecordSchema> | null> {
  return useQuery({
    queryKey: queryKeys.session(urn ?? ''),
    enabled: Boolean(urn),
    queryFn: () => ipc.getSession(urn!) as Promise<z.infer<typeof sessionRecordSchema> | null>
  });
}

export function useDeleteSession(): UseMutationResult<boolean, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (urn) => ipc.deleteSession(urn),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
}

export function useDeleteAllSessions(): UseMutationResult<
  z.infer<typeof deleteAllResultSchema>,
  Error,
  void
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.deleteAllSessions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
}

export function useUpdateSessionTags(): UseMutationResult<
  { ok: boolean; tags?: string[]; error?: string },
  Error,
  { urn: string; tags: string[] }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ urn, tags }) => ipc.updateSessionTags(urn, tags),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['sessions'] });
      void qc.invalidateQueries({ queryKey: queryKeys.session(vars.urn) });
    }
  });
}

export function useSearchSessions(
  query: string,
  k = 10
): UseQueryResult<z.infer<typeof sessionSearchHitSchema>[]> {
  return useQuery({
    queryKey: queryKeys.search(query),
    enabled: query.trim().length > 0,
    queryFn: () =>
      ipc.searchSessions(query, k, 0) as Promise<z.infer<typeof sessionSearchHitSchema>[]>,
    staleTime: 30_000
  });
}

export function useOrphanSessions(): UseQueryResult<z.infer<typeof sessionOrphanSchema>[]> {
  return useQuery({
    queryKey: queryKeys.orphans,
    queryFn: () => ipc.listOrphanSessions() as Promise<z.infer<typeof sessionOrphanSchema>[]>
  });
}

export function useFinalizeOrphan(): UseMutationResult<
  { ok: boolean; error?: string },
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (urn) => ipc.finalizeOrphanSession(urn),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orphans });
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
}

// ── Export / Import ─────────────────────────────────────────────────────

export function useExportAllMarkdown(): UseMutationResult<
  z.infer<typeof exportMarkdownResultSchema>,
  Error,
  void
> {
  return useMutation({
    mutationFn: async () => {
      const res = await ipc.exportAllSessionsAsMarkdown();
      return exportMarkdownResultSchema.parse(res);
    }
  });
}

export function useExportSession(): UseMutationResult<
  z.infer<typeof exportJsonResultSchema>,
  Error,
  string
> {
  return useMutation({
    mutationFn: async (urn) => {
      const res = await ipc.exportSessionAsJson(urn);
      return exportJsonResultSchema.parse(res);
    }
  });
}

export function useSaveSessionJson(): UseMutationResult<
  { ok: boolean; path?: string; cancelled?: boolean; error?: string },
  Error,
  string
> {
  return useMutation({ mutationFn: (urn) => ipc.saveSessionAsJsonToFile(urn) });
}

export function useSaveFilteredSessions(): UseMutationResult<
  {
    ok: boolean;
    path?: string;
    count?: number;
    cancelled?: boolean;
    error?: string;
  },
  Error,
  string[]
> {
  return useMutation({ mutationFn: (urns) => ipc.saveFilteredSessionsAsJsonToFile(urns) });
}

export function useImportSessionJson(): UseMutationResult<
  z.infer<typeof importOneResultSchema>,
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text) => {
      const res = await ipc.importSessionFromJson(text);
      return importOneResultSchema.parse(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] })
  });
}

export function useImportSessionFile(): UseMutationResult<unknown, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.importSessionFromFile(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] })
  });
}

export function useImportSessionsBatch(): UseMutationResult<
  z.infer<typeof importManyResultSchema>,
  Error,
  string[]
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (texts) => {
      const res = await ipc.importSessionsFromJson(texts);
      return importManyResultSchema.parse(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] })
  });
}

export function useImportSessionsFiles(): UseMutationResult<unknown, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.importSessionsFromFiles(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] })
  });
}

// ── Personality ────────────────────────────────────────────────────────

export function usePersonality(): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.personality,
    queryFn: () => ipc.getPersonality()
  });
}

export function useFormattedPersonality(): UseQueryResult<string> {
  return useQuery({
    queryKey: queryKeys.personalityFormatted,
    queryFn: () => ipc.formatPersonality()
  });
}

export function useSetPersonality(): UseMutationResult<unknown, Error, unknown> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile) => ipc.setPersonality(profile),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personality });
      void qc.invalidateQueries({ queryKey: queryKeys.personalityFormatted });
    }
  });
}

export function useResetPersonality(): UseMutationResult<unknown, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.resetPersonality(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personality });
      void qc.invalidateQueries({ queryKey: queryKeys.personalityFormatted });
    }
  });
}

export function useSubmitFeedback(): UseMutationResult<unknown, Error, { sessionId: string; feedback: unknown }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, feedback }) => ipc.submitFeedback(sessionId, feedback),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.feedback(vars.sessionId) });
      void qc.invalidateQueries({ queryKey: queryKeys.personality });
    }
  });
}

export function useReadFeedback(sessionId: string): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.feedback(sessionId),
    queryFn: () => ipc.readFeedback(sessionId)
  });
}

export function useSkipFeedback(): UseMutationResult<unknown, Error, string> {
  return useMutation({ mutationFn: (sessionId) => ipc.skipFeedback(sessionId) });
}

// ── Diagnostics ────────────────────────────────────────────────────────

export function useDiagnostics(): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.diagnostics,
    queryFn: () => ipc.getDiagnostics(),
    // The snapshot is point-in-time, no need for stale refetch.
    staleTime: 30_000
  });
}

export function useLogInfo(): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.logInfo,
    queryFn: () => ipc.getLogInfo()
  });
}

export function useBugReport(): UseMutationResult<unknown, Error, unknown> {
  return useMutation({ mutationFn: (input) => ipc.createBugReport(input) });
}

export function useSaveBugReport(): UseMutationResult<unknown, Error, unknown> {
  return useMutation({ mutationFn: (input) => ipc.saveBugReport(input) });
}

// ── Updates ────────────────────────────────────────────────────────────

export function useUpdateStatus(): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.updateStatus,
    queryFn: () => ipc.getUpdateStatus()
  });
}

export function useCheckForUpdates(): UseMutationResult<void, Error, unknown> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.checkForUpdates(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.updateStatus })
  });
}

// ── Probes ─────────────────────────────────────────────────────────────

export function useProbe(providerId: string | undefined): UseQueryResult<unknown> {
  return useQuery({
    queryKey: queryKeys.probes(providerId ?? ''),
    enabled: Boolean(providerId),
    queryFn: () => ipc.getCachedProbe(providerId!)
  });
}

export function useRunProbe(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId) => ipc.probeProvider(providerId),
    onSuccess: (_, providerId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.probes(providerId) });
    }
  });
}

export function useReprobe(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId) => ipc.reprobeProvider(providerId),
    onSuccess: (_, providerId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.probes(providerId) });
    }
  });
}

// ── Stealth presets / companion / permissions ─────────────────────────

export function useStealthPresets(): UseQueryResult<unknown[]> {
  return useQuery({ queryKey: queryKeys.stealthPresets, queryFn: () => ipc.getStealthPresets() });
}

export function useCompanionStatus(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.companion, queryFn: () => ipc.companionGetStatus() });
}

export function useMediaPermissions(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.mediaPermissions, queryFn: () => ipc.getMediaPermissions() });
}

// ── TTS / vcam ─────────────────────────────────────────────────────────

export function useTtsConfig(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.ttsConfig, queryFn: () => ipc.ttsGetConfig() });
}

export function useSetTtsConfig(): UseMutationResult<unknown, Error, unknown> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => ipc.ttsSetConfig(patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.ttsConfig })
  });
}

export function useTtsSetupStatus(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.ttsSetupStatus, queryFn: () => ipc.ttsSetupStatus() });
}

export function useVcamConfig(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.vcamConfig, queryFn: () => ipc.vcamGetConfig() });
}

export function useSetVcamConfig(): UseMutationResult<unknown, Error, unknown> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => ipc.vcamSetConfig(patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.vcamConfig })
  });
}

export function useVcamStatus(): UseQueryResult<unknown> {
  return useQuery({ queryKey: queryKeys.vcamStatus, queryFn: () => ipc.vcamStatus() });
}