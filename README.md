# KivX Dashboard

The companion web app for [KivX](https://kivx.ai) — handles the long-tail
UI surface (settings, sessions browser, personality viewer, diagnostics,
bug reports) that used to live inside the Electron host. The desktop app
now ships only the in-call overlay surface.

## Stack

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS** with shadcn-style primitives (hand-rolled, no CLI)
- **Geist** + **Geist Mono** via `@fontsource`
- **Zustand** for client state (UI preferences, draft form state, toasts)
- **TanStack Query** for server state over the bridge
- **TanStack Router** (file-tree-less — routes are wired in `App.tsx`)
- **Zod** for runtime validation of every patch leaving the dashboard
- **Lucide** for icons (matches the desktop app's icon set)

## Architecture

```
desktop.kiv.ai                  dashboard.kivx.vexarr.com
┌──────────────────┐            ┌──────────────────────────┐
│ Electron main    │  HTTP/JSON │ Vite + React             │
│   ↓              │ ─────────▶ │   /ipc/<channel>         │
│  ipcMain.handle  │            │   /ipc/stream/<channel>  │  (SSE)
│   ↓              │            │     ↑                    │
│  localhost:7711  │ ◀───────── │  fetch / EventSource     │
└──────────────────┘            └──────────────────────────┘
```

The desktop main process exposes a localhost HTTP server on port `7711`
that mirrors the `window.kivAPI` IPC surface that used to live in the
in-process preload. The Vite dev server proxies `/ipc/*` to it so
the dashboard can be developed against the live desktop host.

## Local dev

```bash
# 1. Start the desktop host (in desktop.kiv.ai)
cd ../desktop.kiv.ai && npm run dev   # serves IPC on :7711

# 2. Start the dashboard
cd dashboard.kivx.vexarr.com
npm install
npm run dev   # http://127.0.0.1:5173
```

Without a running desktop host the dashboard will display
"Offline" in the topbar and every query will fail — that's the
intended behaviour.

## Build

```bash
npm run build      # typecheck + vite build → dist/
npm run preview    # serve dist/ on :5173
```

## Project layout

```
src/
├── main.tsx                    # React root
├── App.tsx                     # TanStack Router tree
├── index.css                   # Tailwind base + Geist
├── lib/
│   ├── ipc.ts                  # typed bridge client (HTTP)
│   ├── query-client.ts         # QueryClient + key factory
│   └── utils.ts                # cn() + format helpers
├── schemas/
│   ├── config.ts               # Zod config schema (mirrors desktop)
│   ├── session.ts              # Zod session / feedback schemas
│   ├── diagnostics.ts          # Zod diagnostics / bug-report
│   └── system.ts               # stealth presets, update status
├── api/
│   └── queries.ts              # all TanStack Query hooks
├── stores/
│   ├── ui-store.ts             # theme + sidebar + last-visited
│   ├── config-drafts.ts        # per-section draft buffer
│   └── toast-store.ts          # toast pub/sub
├── components/
│   ├── ui/                     # primitives (Button, Card, ...)
│   ├── layout/                 # Shell, Sidebar, Topbar, Page
│   └── shared/                 # Field, Section, EmptyState
├── features/                   # one folder per page-cluster
│   ├── settings-llm/
│   ├── settings-audio/
│   ├── settings-stt/
│   ├── settings-tts/
│   ├── settings-hotkeys/
│   ├── settings-prompts/
│   ├── settings-data/
│   ├── settings-camera/
│   ├── settings-telemetry/
│   ├── sessions-browser/
│   ├── personality-viewer/
│   └── diagnostics-panel/
└── routes/                     # one file per TanStack route
    ├── __root.tsx
    ├── index.tsx               # → /settings
    ├── settings/
    │   ├── route.tsx
    │   ├── llm.tsx
    │   ├── audio.tsx
    │   └── ...
    ├── sessions/
    ├── personality/
    └── diagnostics/
```

## Schemas as the contract

Every config mutation is validated client-side via the Zod schemas in
`src/schemas/config.ts` *and* server-side by the desktop's
`configSchema.ts`. The bounds (string caps, numeric ranges, enum
allow-list) are duplicated — the Zod schema is the dashboard-side
source of truth for UI feedback, and the desktop validator is the
authoritative gate.

If a field is added to the desktop, update `schemas/config.ts` here too.

## Adding a route

1. Create `src/routes/<path>.tsx` exporting a `Route` from
   `createRoute({ getParentRoute: () => SomeRoute, path: '…', component })`.
2. Wire it into `src/App.tsx` under the correct parent.
3. Run `npm run typecheck`.

## Adding a UI primitive

The `src/components/ui/` folder is hand-rolled (no shadcn CLI). When
adding a new primitive:

- Use the `cn()` helper from `@/lib/utils` for class merging.
- Export a typed `*Props` interface extending the underlying HTML
  attribute type.
- Forward refs when wrapping an HTML element.
- Keep the style tokens in `tailwind.config.ts` — no inline hex codes.