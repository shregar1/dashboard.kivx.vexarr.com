import { z } from 'zod';

export const diagnosticsSnapshotSchema = z
  .object({
    capturedAt: z.number(),
    platform: z.string(),
    arch: z.string(),
    versions: z.object({
      app: z.string(),
      electron: z.string().optional(),
      chrome: z.string().optional(),
      node: z.string().optional(),
      kivxCore: z.string().optional()
    }),
    memory: z.object({
      rss: z.number(),
      heapUsed: z.number(),
      heapTotal: z.number(),
      external: z.number()
    }),
    cpu: z.object({
      loadAvg: z.array(z.number()).optional(),
      model: z.string().optional(),
      cores: z.number().int().optional()
    }),
    session: z
      .object({
        active: z.boolean(),
        paused: z.boolean().optional(),
        autoListening: z.boolean().optional(),
        listenInterviewer: z.boolean().optional(),
        sessionId: z.string().optional(),
        startedAt: z.number().optional()
      })
      .optional(),
    windows: z.array(
      z.object({
        name: z.string(),
        visible: z.boolean(),
        focused: z.boolean().optional()
      })
    ),
    mediaPermissions: z
      .object({
        microphone: z.enum(['granted', 'denied', 'unknown']),
        screen: z.enum(['granted', 'denied', 'unknown']),
        accessibility: z.enum(['granted', 'denied', 'unknown']).optional()
      })
      .optional(),
    logInfo: z
      .object({
        path: z.string(),
        sizeBytes: z.number().optional()
      })
      .optional(),
    hotPaths: z
      .array(
        z.object({
          label: z.string(),
          p50Ms: z.number(),
          p95Ms: z.number(),
          count: z.number().int()
        })
      )
      .optional()
  })
  .passthrough();
export type DiagnosticsSnapshot = z.infer<typeof diagnosticsSnapshotSchema>;

export const bugReportInputSchema = z.object({
  description: z.string().min(1, 'Please describe the issue').max(8_000),
  email: z.string().email().optional().or(z.literal('')),
  includeLogs: z.boolean().default(true),
  includeSnapshot: z.boolean().default(true)
});
export type BugReportInput = z.infer<typeof bugReportInputSchema>;

export const bugReportResultSchema = z.union([
  z.object({ ok: z.literal(true), reportId: z.string() }),
  z.object({ ok: z.literal(false), error: z.string() })
]);
export type BugReportResult = z.infer<typeof bugReportResultSchema>;