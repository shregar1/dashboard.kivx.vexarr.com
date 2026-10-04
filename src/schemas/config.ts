import { z } from 'zod';

// ── Constants from desktop app ──────────────────────────────────────────
// These bounds are duplicated from `src/main/storage/configSchema.ts` in
// the desktop app. The desktop validator is the source of truth; the
// dashboard enforces the same caps so a stale tab can't draft a patch
// the IPC layer will silently drop on receipt.

export const MAX_API_KEY = 4_096;
export const MAX_URL = 2_048;
export const MAX_HOTKEY_LEN = 64;
export const MAX_FONT = 64;
export const MIN_FONT = 8;
export const MAX_QR_ITEMS = 64;
export const MAX_QR_FIELD = 4_096;

const url = z.string().max(MAX_URL).regex(/^https?:\/\//i, 'must be a http(s) URL');
const apiKey = z.string().max(MAX_API_KEY);
const label = z.string().max(256);
const id = z.string().max(256);
const model = z.string().max(256);

// ── Provider entry (a single named LLM provider in the providers map) ──

export const providerEntrySchema = z.object({
  apiKey: apiKey.optional(),
  baseURL: url.optional(),
  model: model.optional(),
  label: label.optional(),
  id: id.optional(),
  chatCompletionsPath: z.string().max(256).optional(),
  builtin: z.boolean().optional()
});
export type ProviderEntry = z.infer<typeof providerEntrySchema>;

export const providersMapSchema = z.record(z.string().max(256), providerEntrySchema);
export type ProvidersMap = z.infer<typeof providersMapSchema>;

// ── STT / TTS ──────────────────────────────────────────────────────────

export const sttEngineSchema = z.enum([
  'apple', 'whisper', 'whisper-local', 'elevenlabs', 'gemini', 'parakeet'
]);
export type SttEngine = z.infer<typeof sttEngineSchema>;

export const sttConfigSchema = z.object({
  engine: sttEngineSchema.optional(),
  whisperApiKey: apiKey.optional(),
  whisperModel: model.optional(),
  elevenLabsApiKey: apiKey.optional(),
  elevenLabsModel: model.optional(),
  language: z.string().max(32).optional()
});
export type SttConfig = z.infer<typeof sttConfigSchema>;

export const ttsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: apiKey.optional(),
  voiceId: id.optional(),
  modelId: model.optional(),
  outputDeviceId: z.string().max(256).optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  autoSpeak: z.boolean().optional()
});
export type TtsConfig = z.infer<typeof ttsConfigSchema>;

// ── Hotkeys map ────────────────────────────────────────────────────────

export const hotkeysSchema = z.record(z.string().max(64), z.string().max(MAX_HOTKEY_LEN));
export type HotkeysMap = z.infer<typeof hotkeysSchema>;

// ── Virtual camera ─────────────────────────────────────────────────────

const watermarkPosition = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
const transitionType = z.enum(['cut', 'fade', 'dissolve']);

export const vcamProfileSchema = z.object({
  id: id,
  name: label
});
export type VcamProfile = z.infer<typeof vcamProfileSchema>;

export const vcamConfigSchema = z.object({
  videoPath: z.string().max(4_096).optional(),
  mode: z.enum(['off', 'obs', 'browser']).optional(),
  autoStart: z.boolean().optional(),
  loop: z.boolean().optional(),
  width: z.number().int().min(320).max(7_680).optional(),
  height: z.number().int().min(240).max(4_320).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  audioPassthrough: z.boolean().optional(),
  pipEnabled: z.boolean().optional(),
  pipPosition: watermarkPosition.optional(),
  pipSize: z.number().min(5).max(50).optional(),
  activeProfileId: id.optional(),
  bgReplace: z
    .object({
      enabled: z.boolean().optional(),
      backgroundPath: z.string().max(4_096).optional(),
      backgroundType: z.enum(['image', 'blur', 'none']).optional(),
      blurStrength: z.number().min(1).max(50).optional()
    })
    .optional(),
  motionDetect: z
    .object({ enabled: z.boolean().optional(), sensitivity: z.number().min(1).max(100).optional() })
    .optional(),
  watermark: z
    .object({
      enabled: z.boolean().optional(),
      text: z.string().max(256).optional(),
      imagePath: z.string().max(4_096).optional(),
      position: watermarkPosition.optional(),
      opacity: z.number().min(0).max(1).optional(),
      type: z.enum(['text', 'image', 'timestamp']).optional()
    })
    .optional(),
  lowerThird: z
    .object({
      enabled: z.boolean().optional(),
      text: z.string().max(512).optional(),
      fontSize: z.number().int().min(8).max(48).optional(),
      bgColor: z.string().max(32).optional(),
      textColor: z.string().max(32).optional(),
      align: z.enum(['left', 'center', 'right']).optional()
    })
    .optional(),
  transition: z
    .object({ type: transitionType.optional(), durationMs: z.number().min(0).max(5_000).optional() })
    .optional(),
  playlist: z
    .object({
      enabled: z.boolean().optional(),
      files: z.array(z.string().max(4_096)).max(64).optional(),
      shuffle: z.boolean().optional()
    })
    .optional(),
  sceneRotation: z
    .object({
      enabled: z.boolean().optional(),
      intervalSec: z.number().min(5).max(3_600).optional(),
      transition: transitionType.optional()
    })
    .optional(),
  profiles: z.array(vcamProfileSchema).max(16).optional(),
  previewWindow: z.boolean().optional(),
  vcamToggleHotkey: z.string().max(MAX_HOTKEY_LEN).optional()
});
export type VcamConfig = z.infer<typeof vcamConfigSchema>;

// ── Quick responses ────────────────────────────────────────────────────

export const quickResponseSchema = z.object({
  id: z.string().max(256),
  title: z.string().max(MAX_QR_FIELD),
  question: z.string().max(MAX_QR_FIELD),
  response: z.string().max(MAX_QR_FIELD),
  hotkey: z.number().int().min(0).max(99).optional()
});
export type QuickResponse = z.infer<typeof quickResponseSchema>;

// ── Prompt templates ───────────────────────────────────────────────────

export const promptTemplateSchema = z.object({
  id: z.string().max(256),
  name: z.string().max(256),
  body: z.string().max(100_000)
});
export type PromptTemplate = z.infer<typeof promptTemplateSchema>;

// ── Personality profile ────────────────────────────────────────────────

export const personalityProfileSchema = z.object({
  version: z.literal(1),
  summary: z.string().max(8_000),
  dimensions: z.object({
    tone: z.enum(['formal', 'neutral', 'conversational', 'casual', 'direct']),
    verbosity: z.enum(['terse', 'moderate', 'detailed']),
    structure: z.enum(['prose', 'mixed', 'bullets'])
  }),
  doRules: z.array(z.string()).max(8),
  antiPatterns: z.array(z.string()).max(12),
  derivedFromSessions: z.number().int().min(0),
  lastUpdated: z.number()
});
export type PersonalityProfile = z.infer<typeof personalityProfileSchema>;

export const EMPTY_PERSONALITY: PersonalityProfile = {
  version: 1,
  summary: '',
  dimensions: { tone: 'neutral', verbosity: 'moderate', structure: 'mixed' },
  doRules: [],
  antiPatterns: [],
  derivedFromSessions: 0,
  lastUpdated: 0
};

// ── Top-level config ───────────────────────────────────────────────────

export const responseModeSchema = z.enum(['concise', 'detailed', 'auto']);
export type ResponseMode = z.infer<typeof responseModeSchema>;

export const fullConfigSchema = z
  .object({
    activeProvider: z.string().max(256).optional(),
    responseMode: responseModeSchema.optional(),
    overlayOpacity: z.number().min(0.05).max(1).optional(),
    fontSize: z.number().int().min(MIN_FONT).max(MAX_FONT).optional(),
    enableTelemetry: z.boolean().optional(),
    enableAnswerAnalysis: z.boolean().optional(),
    audioSetupVerified: z.boolean().optional(),
    autoCycleListen: z.boolean().optional(),
    sysAudioSource: z.string().max(256).optional(),

    // stealth
    stealthEnabled: z.boolean().optional(),
    stealthPresetId: z.string().max(64).optional(),
    panicHotkey: z.string().max(MAX_HOTKEY_LEN).optional(),
    windowTitleSpoof: z.string().max(256).optional(),
    hideMissionControl: z.boolean().optional(),
    ghostMode: z.boolean().optional(),
    antiFingerprint: z.boolean().optional(),
    clipboardAutoWipe: z.boolean().optional(),
    processTreeSanitize: z.boolean().optional(),
    windowEnumDefense: z.boolean().optional(),
    dnsLeakProtection: z.boolean().optional(),
    multiMonitorAware: z.boolean().optional(),
    logSanitize: z.boolean().optional(),
    memoryScrub: z.boolean().optional(),
    extensionScanner: z.boolean().optional(),
    proctoringScanner: z.boolean().optional(),
    screenShareAutoHide: z.boolean().optional(),
    autoUpdate: z.boolean().optional(),
    clipboardWipeDelaySec: z.number().int().min(1).max(30).optional(),
    networkProxy: z.string().max(MAX_URL).optional(),
    idleCamouflage: z
      .object({ enabled: z.boolean().optional(), timeoutSec: z.number().int().min(5).max(600).optional() })
      .optional(),
    gazeJitter: z
      .object({
        enabled: z.boolean().optional(),
        offsetPx: z.number().min(0).max(200).optional(),
        intervalSec: z.number().min(5).max(300).optional()
      })
      .optional(),

    // sections
    hotkeys: hotkeysSchema.optional(),
    companion: z
      .object({ autoStart: z.boolean().optional(), port: z.number().int().min(1).max(65_535).optional() })
      .optional(),
    screenshot: z
      .object({ display: z.enum(['primary', 'custom']).optional(), maxSide: z.number().int().min(64).max(8_192).optional() })
      .optional(),
    llm: z
      .object({
        apiKey: apiKey.optional(),
        baseURL: url.optional(),
        model: model.optional(),
        maxTokens: z.number().int().min(1).max(1_000_000).optional(),
        chatCompletionsPath: z.string().max(256).optional()
      })
      .optional(),
    providers: providersMapSchema.optional(),
    tts: ttsConfigSchema.optional(),
    stt: sttConfigSchema.optional(),
    translation: z
      .object({
        enabled: z.boolean().optional(),
        nativeLanguage: z.string().max(32).optional(),
        interviewLanguage: z.string().max(32).optional(),
        translateQuestions: z.boolean().optional(),
        translateAnswers: z.boolean().optional()
      })
      .optional(),
    virtualCamera: vcamConfigSchema.optional(),

    // lists
    quickResponses: z.array(quickResponseSchema).max(MAX_QR_ITEMS).optional(),
    promptTemplates: z.array(promptTemplateSchema).max(64).optional(),
    promptTemplateValues: z.record(z.string(), z.unknown()).optional(),
    lastPromptTemplateId: z.string().max(256).optional(),
    lastTags: z.array(z.string().max(64)).max(32).optional(),

    // per-session inputs (kept in config so the wizard can resume)
    sessionJD: z.string().max(500_000).optional(),
    sessionResume: z.string().max(500_000).optional(),
    sessionRules: z.string().max(500_000).optional(),

    // derived
    personalityProfile: personalityProfileSchema.optional()
  })
  .partial()
  .strict();
export type FullConfig = z.infer<typeof fullConfigSchema>;

// ── Patch shape (subset allowed by the desktop validator) ──────────────
//
// The validator in `configSchema.ts` strips unknown top-level keys and
// bounds inner values. Dashboard-side, the patch is a `Partial<FullConfig>`
// constrained to the same allow-list. Anything not in this list gets
// a TS error at the call site and is rejected at the IPC layer too.

export const configPatchSchema = fullConfigSchema;
export type ConfigPatch = z.infer<typeof configPatchSchema>;