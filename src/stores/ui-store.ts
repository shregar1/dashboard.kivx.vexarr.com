import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * UI store (sidebar, theme, last-visited, ephemeral layout state).
 *
 * This is the only store that touches localStorage — everything else
 * is a server-state mirror over IPC. `persist` keys are namespaced
 * under `kivx.dashboard.*` so multiple deployments on the same origin
 * don't collide.
 */

export type Theme = 'dark' | 'light' | 'system';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  lastVisited: string;
  /** `true` while the user has opted into the dev panel. */
  devMode: boolean;

  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setLastVisited: (path: string) => void;
  setDevMode: (v: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      lastVisited: '/settings/llm',
      devMode: false,

      setTheme: (theme) => {
        set({ theme });
        applyThemeClass(theme);
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLastVisited: (lastVisited) => set({ lastVisited }),
      setDevMode: (devMode) => set({ devMode })
    }),
    {
      name: 'kivx.dashboard.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        lastVisited: s.lastVisited,
        devMode: s.devMode
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeClass(state.theme);
      }
    }
  )
);

function applyThemeClass(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Apply once on module load so SSR-style first paint is correct.
applyThemeClass(useUi.getState().theme);