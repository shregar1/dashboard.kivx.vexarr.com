import { create } from 'zustand';

import { configPatchSchema, type ConfigPatch } from '@/schemas/config';

/**
 * Local selection / form-draft state for the Settings page.
 *
 * Config itself is server state — it lives in the TanStack Query cache
 * (`['config']`) and is mutated through the bridge. This store holds
 * the *interim* state for forms that need to:
 *     · survive tab switches while editing
 *     · debounce patches to avoid hot IPC thrash
 *     · diff against the canonical config before flushing
 *
 * Each Settings section writes to its own key in `drafts`. The topbar's
 * "Apply" / "Discard" actions read from here.
 */

export type DraftKey =
  | 'llm'
  | 'audio'
  | 'hotkeys'
  | 'prompts'
  | 'data'
  | 'camera'
  | 'stt'
  | 'tts'
  | 'telemetry';

interface DraftsState {
  drafts: Record<DraftKey, ConfigPatch | null>;
  dirty: Record<DraftKey, boolean>;

  setDraft: (key: DraftKey, patch: ConfigPatch) => void;
  patchDraft: (key: DraftKey, patch: ConfigPatch) => void;
  clearDraft: (key: DraftKey) => void;
  isDirty: (key: DraftKey) => boolean;
  totalDirty: () => number;
}

const emptyDrafts = (): Record<DraftKey, ConfigPatch | null> => ({
  llm: null,
  audio: null,
  hotkeys: null,
  prompts: null,
  data: null,
  camera: null,
  stt: null,
  tts: null,
  telemetry: null
});

export const useConfigDrafts = create<DraftsState>()((set, get) => ({
  drafts: emptyDrafts(),
  dirty: { llm: false, audio: false, hotkeys: false, prompts: false, data: false, camera: false, stt: false, tts: false, telemetry: false },

  setDraft: (key, patch) => {
    // Validate locally so a malformed draft never reaches the IPC layer.
    const result = configPatchSchema.safeParse(patch);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn(`[drafts:${key}] invalid patch`, result.error.flatten());
      return;
    }
    set((s) => ({
      drafts: { ...s.drafts, [key]: result.data },
      dirty: { ...s.dirty, [key]: true }
    }));
  },

  patchDraft: (key, patch) => {
    const current = get().drafts[key] ?? {};
    const next = { ...current, ...patch };
    const result = configPatchSchema.safeParse(next);
    if (!result.success) return;
    set((s) => ({
      drafts: { ...s.drafts, [key]: result.data },
      dirty: { ...s.dirty, [key]: true }
    }));
  },

  clearDraft: (key) =>
    set((s) => ({
      drafts: { ...s.drafts, [key]: null },
      dirty: { ...s.dirty, [key]: false }
    })),

  isDirty: (key) => get().dirty[key],
  totalDirty: () => Object.values(get().dirty).filter(Boolean).length
}));