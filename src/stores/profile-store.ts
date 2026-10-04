import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Profile store — local-only state about the signed-in KivX user.
 *
 * The desktop host owns the actual account state; this store holds
 * just enough to render the avatar + name in the sidebar and pass
 * through the auth metadata for IPC. When the user signs out, the
 * store clears and we hand control back to the host.
 */

export interface KivxProfile {
  email: string;
  displayName: string;
  /** Avatar monogram fallback when no image is set. */
  initials: string;
  /** Account tier — drives the badge in the profile menu. */
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  /** Unix ms — last time we heard from the host. */
  lastSyncedAt: number | null;
}

const DEFAULT: KivxProfile = {
  email: '',
  displayName: 'Guest',
  initials: 'G',
  plan: 'free',
  lastSyncedAt: null
};

interface ProfileState {
  profile: KivxProfile;
  setProfile: (p: Partial<KivxProfile>) => void;
  signOut: () => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT,
      hydrated: false,
      setProfile: (patch) =>
        set((s) => ({
          profile: {
            ...s.profile,
            ...patch,
            // Auto-derive initials when displayName changes.
            initials:
              patch.initials ??
              (patch.displayName
                ? patch.displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('') || s.profile.initials
                : s.profile.initials)
          }
        })),
      signOut: () => set({ profile: { ...DEFAULT, email: '', displayName: 'Signed out' } }),
      setHydrated: (v) => set({ hydrated: v })
    }),
    {
      name: 'kivx.dashboard.profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);