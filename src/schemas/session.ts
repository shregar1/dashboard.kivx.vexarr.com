import { z } from 'zod';

/** `urn:kiv:session:<id>` URN for sessions leaving the IPC layer. */
export const sessionUrnSchema = z.string().regex(/^urn:kiv:session:/);
export type SessionUrn = z.infer<typeof sessionUrnSchema>;

export const sessionListEntrySchema = z.object({
  urn: sessionUrnSchema,
  id: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  turnCount: z.number().int().min(0),
  jdSnippet: z.string().optional(),
  summary: z.string().optional(),
  dominantProviderLabel: z.string().optional(),
  searchText: z.string().optional(),
  tags: z.array(z.string()).optional()
});
export type SessionListEntryDto = z.infer<typeof sessionListEntrySchema>;

export const sessionFeedbackSchema = z.object({
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
  ]),
  wentWell: z.string().max(4 * 1024),
  improveNext: z.string().max(4 * 1024),
  tags: z.array(
    z.enum([
      'too-verbose',
      'too-terse',
      'too-formal',
      'too-casual',
      'wrong-tone',
      'great',
      'wrong-content',
      'should-not-have-asked'
    ])
  ),
  notes: z.string().max(4 * 1024),
  submittedAt: z.number(),
  sessionId: z.string()
});
export type SessionFeedback = z.infer<typeof sessionFeedbackSchema>;

export const sessionTurnSchema = z.object({
  ts: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  providerId: z.string().optional(),
  providerLabel: z.string().optional()
});
export type SessionTurn = z.infer<typeof sessionTurnSchema>;

export const sessionRecordSchema = z.object({
  urn: sessionUrnSchema,
  id: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  jdSnippet: z.string().optional(),
  resumeSnippet: z.string().optional(),
  turns: z.array(sessionTurnSchema).optional(),
  tags: z.array(z.string()).optional(),
  analysis: z.object({ summary: z.string().optional() }).optional(),
  feedback: sessionFeedbackSchema.optional()
});
export type SessionRecordDto = z.infer<typeof sessionRecordSchema>;

export const sessionSearchHitSchema = z.object({
  sessionId: z.string(),
  score: z.number(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  turnCount: z.number().int().min(0),
  topicTags: z.array(z.string()),
  jdSnippet: z.string().optional()
});
export type SessionSearchHit = z.infer<typeof sessionSearchHitSchema>;

export const sessionOrphanSchema = z.object({
  sessionUrn: sessionUrnSchema,
  startedAt: z.number(),
  turnCount: z.number().int().min(0),
  jdSnippet: z.string().optional()
});
export type SessionOrphan = z.infer<typeof sessionOrphanSchema>;

export const deleteAllResultSchema = z.object({ ok: z.boolean(), removed: z.number() });

export const importOneResultSchema = z.union([
  z.object({ ok: z.literal(true), sessionUrn: sessionUrnSchema, reKeyed: z.boolean(), originalId: z.string().optional() }),
  z.object({ ok: z.literal(false), error: z.string() })
]);
export type ImportOneResult = z.infer<typeof importOneResultSchema>;

export const importManyResultSchema = z.object({
  ok: z.boolean(),
  imported: z.number().int().min(0),
  skippedDuplicate: z.number().int().min(0),
  failed: z.array(z.object({ reason: z.string() })),
  scanned: z.number().int().min(0).optional()
});
export type ImportManyResult = z.infer<typeof importManyResultSchema>;

export const exportMarkdownResultSchema = z.object({ ok: z.literal(true), markdown: z.string(), count: z.number() });

export const exportJsonResultSchema = z.union([
  z.object({ ok: z.literal(true), json: z.string(), filename: z.string(), path: z.string().optional() }),
  z.object({ ok: z.literal(false), error: z.string(), cancelled: z.boolean().optional() })
]);
export type ExportJsonResult = z.infer<typeof exportJsonResultSchema>;