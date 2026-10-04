import { useState } from 'react';
import { createRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Tag, Trash2, Download, Save, Star, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Confirm } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

import { Route as SessionsRoute } from '@/routes/sessions/route';

import {
  useSession,
  useDeleteSession,
  useUpdateSessionTags,
  useSaveSessionJson,
  useReadFeedback,
  useSkipFeedback,
  useResetPersonality,
  useSubmitFeedback
} from '@/api/queries';
import type { SessionRecordDto } from '@/schemas/session';
import { toast } from '@/stores/toast-store';
import { formatDateTime, formatRelativeTime, truncate } from '@/lib/utils';
import { sessionFeedbackSchema } from '@/schemas/session';

export const Route = createRoute({
  getParentRoute: () => SessionsRoute,
  path: '$urn',
  component: SessionDetailPage
});

function SessionDetailPage() {
  const { urn } = Route.useParams();
  const session = useSession(urn);
  const deleteSession = useDeleteSession();
  const exportSession = useSaveSessionJson();
  const updateTags = useUpdateSessionTags();
  const router = useRouter();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  const rec = session.data as SessionRecordDto | null | undefined;
  const turns = rec?.turns ?? [];

  async function handleDelete() {
    setConfirmDelete(false);
    try {
      await deleteSession.mutateAsync(urn);
      toast({ variant: 'info', title: 'Session deleted' });
      void router.navigate({ to: '/sessions' });
    } catch (e) {
      toast({ variant: 'error', title: 'Delete failed', description: String(e) });
    }
  }

  async function handleExport() {
    try {
      const res = await exportSession.mutateAsync(urn);
      if (res.ok) toast({ variant: 'success', title: `Saved to ${res.path}` });
      else if (res.cancelled) toast({ variant: 'info', title: 'Cancelled' });
      else toast({ variant: 'error', title: 'Export failed', description: res.error });
    } catch (e) {
      toast({ variant: 'error', title: 'Export failed', description: String(e) });
    }
  }

  function addTag() {
    const next = (rec?.tags ?? []).concat(tagDraft.trim()).filter(Boolean);
    setTagDraft('');
    updateTags.mutate(
      { urn, tags: next },
      { onSuccess: () => toast({ variant: 'success', title: 'Tags updated' }) }
    );
  }

  if (session.isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Loading session…</p>;
  }
  if (session.isError) {
    return <p className="p-6 text-sm text-destructive">Couldn't load session.</p>;
  }
  if (!rec) {
    return <p className="p-6 text-sm text-muted-foreground">Session not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All sessions
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="size-3.5" />} onClick={handleExport} loading={exportSession.isPending}>
            Export JSON
          </Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="size-3.5" />} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{truncate(rec.jdSnippet, 100) || 'Untitled session'}</CardTitle>
              <CardDescription>
                <span className="font-mono text-xs">{rec.id}</span> ·{' '}
                {formatDateTime(rec.startedAt)}
                {rec.endedAt ? ` → ${formatDateTime(rec.endedAt)}` : ' · open'}
              </CardDescription>
            </div>
            {rec.analysis?.summary && (
              <Badge variant="success" className="shrink-0 gap-1"><Sparkles className="size-3" /> analyzed</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {rec.analysis?.summary && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
              <p className="mt-1 text-sm">{rec.analysis?.summary}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(rec.tags ?? []).map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="add tag…"
                  className="h-7 w-32 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button size="sm" variant="ghost" leftIcon={<Tag className="size-3.5" />} onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          {rec.jdSnippet && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job description snippet</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{rec.jdSnippet}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <FeedbackSection sessionId={rec.id} />

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>{turns.length} turns</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {turns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No turns recorded for this session.</p>
          ) : (
            turns.map((t, idx) => (
              <div key={idx} className="rounded-md border border-border bg-card/50 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={t.role === 'assistant' ? 'info' : 'secondary'} className="capitalize">{t.role}</Badge>
                  {t.providerLabel && <span>{t.providerLabel}</span>}
                  <span>· {formatRelativeTime(t.ts)}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs">{t.content}</pre>
                {idx < turns.length - 1 && <Separator className="mt-3" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Confirm
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this session?"
        description="Removes the session and its transcript permanently."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FeedbackSection({ sessionId }: { sessionId: string }) {
  const feedback = useReadFeedback(sessionId);
  const submit = useSubmitFeedback();
  const skip = useSkipFeedback();
  const reset = useResetPersonality();

  const data = feedback.data as
    | { rating: number; wentWell?: string; improveNext?: string; tags?: string[]; submittedAt?: number }
    | null
    | undefined;

  const [rating, setRating] = useState(4);
  const [wentWell, setWentWell] = useState('');
  const [improve, setImprove] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function submitFeedback() {
    const parsed = sessionFeedbackSchema.safeParse({
      rating,
      wentWell,
      improveNext: improve,
      tags,
      notes: '',
      submittedAt: Date.now(),
      sessionId
    });
    if (!parsed.success) {
      toast({ variant: 'error', title: 'Invalid feedback' });
      return;
    }
    submit.mutate(
      { sessionId, feedback: parsed.data },
      {
        onSuccess: () => toast({ variant: 'success', title: 'Feedback saved' })
      }
    );
  }

  const TAG_OPTIONS = ['too-verbose', 'too-terse', 'too-formal', 'too-casual', 'wrong-tone', 'great', 'wrong-content', 'should-not-have-asked'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Star className="size-4" /> Feedback</CardTitle>
          <CardDescription>Drives the personality profile over time.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => skip.mutate(sessionId)}>
          Skip
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="info">{'★'.repeat(data.rating)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(data.submittedAt)}</span>
            </div>
            {data.wentWell && (
              <p className="mt-2">
                <span className="font-medium">Went well: </span>
                {data.wentWell}
              </p>
            )}
            {data.improveNext && (
              <p className="mt-1">
                <span className="font-medium">Improve next: </span>
                {data.improveNext}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Label>Rating</Label>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    onClick={() => setRating(n)}
                    className={`px-1 text-xl transition-colors ${rating >= n ? 'text-warning' : 'text-muted-foreground/40'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="What went well?"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="What could be better next time?"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <div className="flex flex-wrap items-center gap-2">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    tags.includes(t) ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => reset.mutate(undefined)}>
                Reset personality
              </Button>
              <Button size="sm" leftIcon={<Save className="size-3.5" />} onClick={submitFeedback} loading={submit.isPending}>
                Submit feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// silence unused