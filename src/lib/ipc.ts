/**
 * IPC client — talks to the KivX desktop host over HTTP.
 *
 * The desktop main process exposes a localhost HTTP server on
 * `KIVX_DASHBOARD_PORT` (default 7711) that mirrors the
 * `window.kivAPI` surface that used to live in the in-process preload
 * bridge. The dashboard talks to it via `fetch('/ipc/<channel>', ...)`
 * where the dev server (and the desktop's bundled HTTP host) reverse-
 * proxy `/ipc/*` to that port.
 *
 * Each `ipcMain.handle(channel, fn)` on the desktop side becomes an
 * `ipcInvoke<T>(channel, ...args)` here. The HTTP server normalises
 * handler return values to JSON; everything passes through `unwrap`.
 *
 * Push channels (main → renderer) don't go over HTTP. Those are
 * exposed as a separate EventSource/SSE stream under `/ipc/stream`
 * and consumed via `subscribe()`.
 */

import { z } from 'zod';

import { fullConfigSchema, type FullConfig } from '@/schemas/config';

const DEFAULT_HOST = 'http://127.0.0.1:7711';

let baseUrl = DEFAULT_HOST;
let authToken: string | null = null;

try {
  // 1. localStorage (user-set via "Set host" screen).
  const stored = window.localStorage.getItem('kivx.dashboard.host');
  if (stored) baseUrl = stored;
  // 2. Persisted auth token.
  const tok = window.localStorage.getItem('kivx.dashboard.token');
  if (tok) authToken = tok;
  // 3. Meta tag injected by the desktop bridge when serving the SPA
  //    from the same origin (production deploy).
  const meta = document.querySelector<HTMLMetaElement>('meta[name="kivx-bridge-token"]');
  if (meta?.content) {
    authToken = meta.content;
    try {
      window.localStorage.setItem('kivx.dashboard.token', meta.content);
    } catch {
      /* ignore */
    }
  }
} catch {
  /* localStorage unavailable — fall back to default */
}

export function setKivxHost(url: string): void {
  baseUrl = url.replace(/\/+$/, '');
  try {
    window.localStorage.setItem('kivx.dashboard.host', baseUrl);
  } catch {
    /* ignore */
  }
}

export function setAuthToken(token: string): void {
  authToken = token;
  try {
    window.localStorage.setItem('kivx.dashboard.token', token);
  } catch {
    /* ignore */
  }
}

export function getKivxHost(): string {
  return baseUrl;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class IpcError extends Error {
  readonly status: number;
  readonly channel: string;
  constructor(channel: string, status: number, message: string) {
    super(`[${channel}] ${status}: ${message}`);
    this.name = 'IpcError';
    this.status = status;
    this.channel = channel;
  }
}

async function ipcInvoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (authToken) headers.authorization = `Bearer ${authToken}`;

  const res = await fetch(`${baseUrl}/ipc/${channel}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ args })
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) detail = j.error;
    } catch {
      /* non-JSON error body */
    }
    throw new IpcError(channel, res.status, detail);
  }
  return (await res.json()) as T;
}

async function ipcInvokeVoid(channel: string, ...args: unknown[]): Promise<void> {
  await ipcInvoke<null>(channel, ...args);
}

// ── Typed surface ──────────────────────────────────────────────────────

// Parsers live alongside the call so a malformed payload surfaces as a
// Zod error rather than a runtime `undefined.something` access.
const P = {
  config: fullConfigSchema,
  sessionState: z.unknown(),
  // diagnostics / sessions / personality schemas live in their files.
};

export const ipc = {
  // ── Config ──────────────────────────────────────────────────────
  getConfig: () => ipcInvoke<FullConfig>('config:get').then((c) => P.config.parse(c)),
  setConfig: (patch: unknown) => ipcInvoke<unknown>('config:set', patch),

  // ── Session ─────────────────────────────────────────────────────
  startSession: () => ipcInvokeVoid('session:start'),
  endSession: () => ipcInvokeVoid('session:end'),
  getSessionState: () => ipcInvoke<unknown>('session:getState'),

  // ── Sessions ────────────────────────────────────────────────────
  listSessions: (limit?: number) => ipcInvoke<unknown[]>('sessions:list', limit ?? 1000),
  getSession: (urn: string) => ipcInvoke<unknown | null>('sessions:get', urn),
  deleteSession: (urn: string) => ipcInvoke<boolean>('sessions:delete', urn),
  deleteAllSessions: () => ipcInvoke<{ ok: boolean; removed: number }>('sessions:deleteAll'),
  updateSessionTags: (urn: string, tags: string[]) =>
    ipcInvoke<{ ok: boolean; tags?: string[]; error?: string }>('sessions:updateTags', urn, tags),
  exportAllSessionsAsMarkdown: () =>
    ipcInvoke<{ ok: true; markdown: string; count: number }>('sessions:exportAllAsMarkdown'),
  exportSessionAsJson: (urn: string) =>
    ipcInvoke<{ ok: true; json: string; filename: string } | { ok: false; error: string }>(
      'sessions:exportAsJson',
      urn
    ),
  saveSessionAsJsonToFile: (urn: string) =>
    ipcInvoke<{ ok: boolean; path?: string; cancelled?: boolean; error?: string }>(
      'sessions:saveAsJsonToFile',
      urn
    ),
  saveFilteredSessionsAsJsonToFile: (urns: string[]) =>
    ipcInvoke<{ ok: boolean; path?: string; count?: number; cancelled?: boolean; error?: string }>(
      'sessions:saveFilteredJsonToFile',
      urns
    ),
  importSessionFromJson: (text: string) => ipcInvoke<unknown>('sessions:importJson', text),
  importSessionFromFile: () => ipcInvoke<unknown>('sessions:importJsonFromFile'),
  importSessionsFromJson: (texts: string[]) => ipcInvoke<unknown>('sessions:importJsonBatch', texts),
  importSessionsFromFiles: () => ipcInvoke<unknown>('sessions:importJsonFromFiles'),
  listOrphanSessions: () => ipcInvoke<unknown[]>('sessions:listOrphans'),
  finalizeOrphanSession: (urn: string) => ipcInvoke<{ ok: boolean; error?: string }>(
    'sessions:finalizeOrphan',
    urn
  ),
  searchSessions: (query: string, k = 10, minScore = 0) =>
    ipcInvoke<unknown[]>('sessions:search', query, k, minScore),

  // ── Personality + feedback ──────────────────────────────────────
  getPersonality: () => ipcInvoke<unknown>('personality:get'),
  resetPersonality: () => ipcInvoke<unknown>('personality:reset'),
  setPersonality: (profile: unknown) => ipcInvoke<unknown>('personality:set', profile),
  formatPersonality: () => ipcInvoke<string>('personality:format'),
  submitFeedback: (sessionId: string, feedback: unknown) =>
    ipcInvoke<unknown>('feedback:submit', sessionId, feedback),
  readFeedback: (sessionId: string) => ipcInvoke<unknown>('feedback:read', sessionId),
  skipFeedback: (sessionId: string) => ipcInvoke<unknown>('feedback:skip', sessionId),

  // ── Diagnostics + bug reports ───────────────────────────────────
  getDiagnostics: () => ipcInvoke<unknown>('diagnostics:snapshot'),
  getLogInfo: () => ipcInvoke<unknown>('app:getLogInfo'),
  openLogs: () => ipcInvokeVoid('app:openLogs'),
  relaunch: () => ipcInvokeVoid('app:relaunch'),
  openExternal: (url: string) => ipcInvokeVoid('app:openExternal', url),
  createBugReport: (input: unknown) => ipcInvoke<unknown>('support:createReport', input),
  saveBugReport: (input: unknown) => ipcInvoke<unknown>('support:saveReport', input),
  openSupportEmail: (input: unknown) => ipcInvokeVoid('support:openSupportEmail', input),

  // ── Updates ─────────────────────────────────────────────────────
  getUpdateStatus: () => ipcInvoke<unknown>('update:getStatus'),
  checkForUpdates: () => ipcInvokeVoid('update:check'),
  installUpdate: () => ipcInvokeVoid('update:install'),

  // ── Providers / probes ──────────────────────────────────────────
  probeProvider: (providerId: string) => ipcInvoke<unknown>('provider:probe', providerId),
  getCachedProbe: (providerId: string) => ipcInvoke<unknown>('provider:getCachedProbe', providerId),
  reprobeProvider: (providerId: string) => ipcInvoke<unknown>('provider:reprobe', providerId),

  // ── KivX account / auth ─────────────────────────────────────────
  kivSignup: (payload: unknown) => ipcInvoke<unknown>('kiv:signup', payload),
  kivLogin: (payload: unknown) => ipcInvoke<unknown>('kiv:login', payload),
  kivCreateApiKey: (payload: unknown) => ipcInvoke<unknown>('kiv:createApiKey', payload),

  // ── Stealth presets ─────────────────────────────────────────────
  getStealthPresets: () => ipcInvoke<unknown[]>('stealth:getPresets'),

  // ── Permissions / displays ─────────────────────────────────────
  listDisplays: () => ipcInvoke<unknown[]>('displays:list'),
  getPrimaryDesktopSourceId: () => ipcInvoke<string>('displayMedia:primarySourceId'),
  getMediaPermissions: () => ipcInvoke<unknown>('permissions:mediaStatus'),
  openScreenRecordingSettings: () => ipcInvokeVoid('permissions:openScreenRecordingSettings'),

  // ── TTS ─────────────────────────────────────────────────────────
  ttsGetConfig: () => ipcInvoke<unknown>('tts:getConfig'),
  ttsSetConfig: (patch: unknown) => ipcInvoke<unknown>('tts:setConfig', patch),
  ttsSynthesize: (text: string) => ipcInvoke<unknown>('tts:synthesize', text),
  ttsStop: () => ipcInvokeVoid('tts:stop'),
  ttsAutoSetup: () => ipcInvokeVoid('tts:autoSetup'),
  ttsFinalizeSetup: () => ipcInvokeVoid('tts:finalizeSetup'),
  ttsSetupStatus: () => ipcInvoke<unknown>('tts:setupStatus'),

  // ── Virtual camera ──────────────────────────────────────────────
  vcamStatus: () => ipcInvoke<unknown>('vcam:status'),
  vcamGetConfig: () => ipcInvoke<unknown>('vcam:getConfig'),
  vcamSetConfig: (patch: unknown) => ipcInvoke<unknown>('vcam:setConfig', patch),
  vcamStart: () => ipcInvokeVoid('vcam:start'),
  vcamStop: () => ipcInvokeVoid('vcam:stop'),
  vcamProbeVideo: (path: string) => ipcInvoke<unknown>('vcam:probeVideo', path),
  vcamSelectVideo: () => ipcInvoke<string | null>('vcam:selectVideo'),
  vcamSelectBackground: () => ipcInvoke<string | null>('vcam:selectBackground'),
  vcamSelectWatermarkImage: () => ipcInvoke<string | null>('vcam:selectWatermarkImage'),
  vcamSelectPlaylistFiles: () => ipcInvoke<string[]>('vcam:selectPlaylistFiles'),
  vcamSelectRecordingDir: () => ipcInvoke<string | null>('vcam:selectRecordingDir'),
  vcamSelectLut: () => ipcInvoke<string | null>('vcam:selectLut'),

  // ── Companion LAN server ────────────────────────────────────────
  companionStart: () => ipcInvokeVoid('companion:start'),
  companionStop: () => ipcInvokeVoid('companion:stop'),
  companionGetStatus: () => ipcInvoke<unknown>('companion:getStatus')
};

// ── Push subscriptions ─────────────────────────────────────────────────
//
// Push channels from the desktop (session:state, providerProbeUpdate,
// update:status, …) stream over an EventSource on `/ipc/stream`. Each
// subscription is one named channel; `subscribe` returns the disposer.

type Listener<T> = (payload: T) => void;

export function subscribe<T>(channel: string, listener: Listener<T>): () => void {
  const url = `${baseUrl}/ipc/stream/${encodeURIComponent(channel)}`;
  // EventSource can't set Authorization headers natively. We append
  // the token as a query string for SSE — the bridge accepts it from
  // the loopback URL because there's no way to attach a header from
  // a browser-side EventSource. (`same-origin` production deploys share
  // the auth meta tag, so this is only used as a fallback for dev.)
  const finalUrl = authToken ? `${url}?token=${encodeURIComponent(authToken)}` : url;
  const es = new EventSource(finalUrl, { withCredentials: false });

  const handler = (evt: MessageEvent<string>) => {
    try {
      listener(JSON.parse(evt.data) as T);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[bridge:${channel}] malformed push payload`, err);
    }
  };

  es.addEventListener('message', handler);

  es.addEventListener('error', () => {
    // EventSource auto-reconnects. Only escalate if it goes CLOSED for
    // good — `readyState === 2` is the closed state.
    if (es.readyState === EventSource.CLOSED) {
      // eslint-disable-next-line no-console
      console.warn(`[bridge:${channel}] stream closed`);
    }
  });

  return () => {
    es.removeEventListener('message', handler);
    es.close();
  };
}