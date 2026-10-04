import { z } from 'zod';

export const stealthPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  flags: z.record(z.string(), z.boolean()).optional()
});
export type StealthPreset = z.infer<typeof stealthPresetSchema>;

// Provider probe — cached + fresh

export const providerProbeStatusSchema = z.enum(['idle', 'probing', 'ok', 'fail', 'cached']);
export type ProviderProbeStatus = z.infer<typeof providerProbeStatusSchema>;

export const providerProbeResultSchema = z.object({
  providerId: z.string(),
  status: providerProbeStatusSchema,
  latencyMs: z.number().optional(),
  model: z.string().optional(),
  message: z.string().optional(),
  probedAt: z.number().optional()
});
export type ProviderProbeResult = z.infer<typeof providerProbeResultSchema>;

// Update status

export const updateStatusSchema = z.object({
  state: z.enum(['idle', 'checking', 'available', 'not-available', 'downloading', 'downloaded', 'error']),
  version: z.string().optional(),
  progress: z.number().min(0).max(1).optional(),
  error: z.string().optional()
});
export type UpdateStatus = z.infer<typeof updateStatusSchema>;

// Session state (live, broadcast over IPC)

export const sessionStateSchema = z.object({
  active: z.boolean(),
  paused: z.boolean().optional(),
  sessionId: z.string().optional(),
  startedAt: z.number().optional(),
  autoListening: z.boolean().optional(),
  listenInterviewer: z.boolean().optional(),
  overlayVisible: z.boolean().optional()
});
export type SessionState = z.infer<typeof sessionStateSchema>;

// KivX auth

export const kivAccountSchema = z.object({
  email: z.string().email(),
  apiKey: z.string().optional()
});
export type KivAccount = z.infer<typeof kivAccountSchema>;