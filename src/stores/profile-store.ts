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
  /** Opaque API key the user pasted on the sign-in page. Never logged. */
  apiKey: string | null;
  /** True once the user has authenticated with a KivX API key. */
  isAuthenticated: boolean;
  setProfile: (p: Partial<KivxProfile>) => void;
  signIn: (input: { apiKey: string; email: string; displayName: string; plan?: KivxProfile['plan'] }) => void;
  signOut: () => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT,
      apiKey: null,
      isAuthenticated: false,
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
      signIn: (input) =>
        set((s) => ({
          apiKey: input.apiKey,
          isAuthenticated: true,
          profile: {
            ...s.profile,
            email: input.email,
            displayName: input.displayName,
            plan: input.plan ?? s.profile.plan,
            initials:
              input.displayName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('') || s.profile.initials,
            lastSyncedAt: Date.now()
          }
        })),
      signOut: () =>
        set({
          apiKey: null,
          isAuthenticated: false,
          profile: { ...DEFAULT, email: '', displayName: 'Signed out' }
        }),
      setHydrated: (v) => set({ hydrated: v })
    }),
    {
      name: 'kivx.dashboard.profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        apiKey: s.apiKey,
        isAuthenticated: s.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);