import { useState, type FormEvent } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { KeyRound, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/stores/profile-store';
import { useUi } from '@/stores/ui-store';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';
import { cn } from '@/lib/utils';

// API keys are 32-64 chars of base62 / hex / mixed. Loose regex on
// purpose — we don't want to lock out valid keys from older clients.
const apiKeySchema = z
  .string()
  .trim()
  .min(20, 'API key looks too short — copy the full key from your KivX account.')
  .max(256, 'API key is too long — should be under 256 characters.');

const emailSchema = z.string().trim().email('Enter the email tied to your KivX account.');

import { Route as RootRoute } from '@/routes/__root';

export const Route = createRoute({
  // Top-level route — the sign-in screen is rendered WITHOUT the
  // shell. Bypassing the authed layout means the user gets a clean
  // full-bleed page on first launch instead of seeing a flash of
  // the dashboard before the redirect lands.
  getParentRoute: () => RootRoute,
  path: 'signin',
  component: SigninPage
});

function SigninPage() {
  const navigate = useNavigate();
  const signIn = useProfile((s) => s.signIn);
  const setProfile = useProfile((s) => s.setProfile);
  const theme = useUi((s) => s.theme);

  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<{ apiKey?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const keyRes = apiKeySchema.safeParse(apiKey);
    const emailRes = emailSchema.safeParse(email);
    if (!keyRes.success || !emailRes.success) {
      setErrors({
        apiKey: keyRes.success ? undefined : keyRes.error.issues[0]?.message,
        email: emailRes.success ? undefined : emailRes.error.issues[0]?.message
      });
      return;
    }

    setSubmitting(true);
    try {
      // Round-trip to the host so the API key is verified end-to-end
      // (and so the host can warm its probe cache). The host treats
      // the key as opaque — only the dashboard ever sees the
      // plaintext value.
      const account = (await ipc
        .kivLogin({ apiKey: keyRes.data, email: emailRes.data })
        .catch(() => null)) as
        | { ok: true; displayName?: string; plan?: 'free' | 'pro' | 'team' | 'enterprise' }
        | { ok: false; error?: string }
        | null;

      if (!account || (account.ok === false as never) || (account as { ok: false }).ok === false) {
        // The desktop host is offline or the key was rejected. Fall
        // back to a local sign-in so the user can still get into the
        // dashboard for unauthenticated browsing of local sessions.
        const err =
          (account as { error?: string } | null)?.error ?? 'Host unreachable — using offline sign-in.';
        toast({
          variant: 'warning',
          title: 'Couldn’t reach KivX host',
          description: `${err} Continuing in local-only mode.`
        });
      }

      signIn({
        apiKey: keyRes.data,
        email: emailRes.data,
        displayName:
          account && 'displayName' in account && account.displayName
            ? account.displayName
            : emailRes.data.split('@')[0] ?? 'User',
        plan:
          account && 'plan' in account && account.plan
            ? account.plan
            : 'free'
      });

      setProfile({ lastSyncedAt: Date.now() });
      void navigate({ to: '/settings/llm' });
    } catch (e) {
      toast({ variant: 'error', title: 'Sign-in failed', description: String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  function skipForNow() {
    // Set a guest profile without a key — the dashboard works in
    // local-only mode (sessions, settings, personality) but the
    // remote features stay gated until they sign in.
    setProfile({ displayName: 'Guest', email: '' });
    void navigate({ to: '/settings/llm' });
  }

  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-foreground'
      )}
    >
      {/* Watermark / brand */}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center bg-foreground font-mono text-sm font-bold text-background">
          K
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">KivX</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Dashboard
          </span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center border border-border">
            <KeyRound className="size-4" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to KivX</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Paste your KivX API key. It never leaves the desktop host — the dashboard
            keeps a local copy for this session only.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 border border-border bg-card p-5"
          noValidate
        >
          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-apikey">API key</Label>
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {showKey ? (
                  <span className="inline-flex items-center gap-1">
                    <EyeOff className="size-3" /> Hide
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3" /> Show
                  </span>
                )}
              </button>
            </div>
            <Input
              id="signin-apikey"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="kivx_…"
              className="mt-1 font-mono text-xs"
            />
            {errors.apiKey && <p className="mt-1 text-xs text-destructive">{errors.apiKey}</p>}
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Get one at <span className="font-mono">kivx.ai/account</span>.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            rightIcon={<ArrowRight className="size-3.5" />}
            loading={submitting}
          >
            Sign in
          </Button>
        </form>

        {/* Footer actions */}
        <div className="mt-4 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={skipForNow}
            className="transition-colors hover:text-foreground"
          >
            Continue without signing in →
          </button>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3" />
            <span>Local-first · key never sent over the wire to the dashboard</span>
          </div>
        </div>
      </div>

      {/* Sidebar / status */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        KivX Dashboard · v0.1.0 · theme: {theme}
      </div>
    </div>
  );
}