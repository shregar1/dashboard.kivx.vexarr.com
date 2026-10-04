import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Search,
  Trash2,
  Download,
  Tag,
  ChevronRight,
  AlertTriangle,
  History as HistoryIcon,
  Plus
} from 'lucide-react';

import { Section, EmptyState } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Confirm } from '@/components/ui/dialog';

import {
  useSessions,
  useDeleteSession,
  useSaveSessionJson,
  useSearchSessions,
  useOrphanSessions,
  useFinalizeOrphan
} from '@/api/queries';
import type { SessionListEntryDto } from '@/schemas/session';
import { toast } from '@/stores/toast-store';
import { formatRelativeTime, truncate } from '@/lib/utils';

import { SessionWizard } from './SessionWizard';

export function SessionsBrowserPanel() {
  const sessions = useSessions();
  const deleteSession = useDeleteSession();
  const exportSession = useSaveSessionJson();

  const orphans = useOrphanSessions();
  const finalizeOrphan = useFinalizeOrphan();

  const [q, setQ] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const list = sessions.data ?? [];
  const search = useSearchSessions(q);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (s) =>
        s.summary?.toLowerCase().includes(needle) ||
        s.jdSnippet?.toLowerCase().includes(needle) ||
        s.searchText?.toLowerCase().includes(needle) ||
        s.tags?.some((t) => t.toLowerCase().includes(needle)) ||
        s.dominantProviderLabel?.toLowerCase().includes(needle)
    );
  }, [list, q]);

  async function handleDelete(urn: string) {
    setConfirmDelete(null);
    try {
      await deleteSession.mutateAsync(urn);
      toast({ variant: 'info', title: 'Session deleted' });
    } catch (e) {
      toast({ variant: 'error', title: 'Delete failed', description: String(e) });
    }
  }

  async function handleExport(urn: string) {
    try {
      const res = await exportSession.mutateAsync(urn);
      if (res.ok) toast({ variant: 'success', title: `Saved to ${res.path}` });
      else if (res.cancelled) toast({ variant: 'info', title: 'Cancelled' });
      else toast({ variant: 'error', title: 'Export failed', description: res.error });
    } catch (e) {
      toast({ variant: 'error', title: 'Export failed', description: String(e) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Sessions"
        description="Every interview KivX has recorded. Click a row to inspect the full transcript, then export or delete."
        footer={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="size-3" />}
            onClick={() => setWizardOpen(true)}
          >
            Create session
          </Button>
        }
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by summary, JD snippet, or tags…"
            className="flex-1 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {filtered.length} / {list.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="size-6" />}
            title={list.length === 0 ? 'No sessions yet' : 'No matches'}
            description={
              list.length === 0
                ? 'Start a session in the overlay to record your first one.'
                : 'Try a different search term.'
            }
          />
        ) : (
          <ul>
            {filtered.map((s) => (
              <SessionRow
                key={s.urn}
                session={s}
                onDelete={() => setConfirmDelete(s.urn)}
                onExport={() => handleExport(s.urn)}
                deleting={deleteSession.isPending}
                exporting={exportSession.isPending}
              />
            ))}
          </ul>
        )}
      </Section>

      {q.trim().length > 0 && search.data && search.data.length > 0 && (
        <Section title="Semantic matches" description="Embedding-based search across session transcripts.">
          <ul>
            {search.data.map((hit) => (
              <li key={hit.sessionId} className="flex items-center justify-between gap-4 border-b border-border p-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {truncate(hit.jdSnippet, 80) || 'No JD'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    score {hit.score.toFixed(2)} · {hit.turnCount} turns · {formatRelativeTime(hit.startedAt)}
                  </div>
                </div>
                <Badge variant="outline">{hit.topicTags.slice(0, 3).join(', ') || 'general'}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(orphans.data ?? []).length > 0 && (
        <Section
          title="Orphans"
          description="Sessions with turns but no endedAt — usually force-quit recovery. Finalize to attach a summary."
        >
          <ul>
            {(orphans.data ?? []).map((o) => (
              <li
                key={o.sessionUrn}
                className="flex items-center justify-between gap-4 border-b border-border p-3 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning" />
                  <span className="text-sm font-medium">{truncate(o.jdSnippet, 60) || 'No JD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{o.turnCount} turns</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      finalizeOrphan.mutate(o.sessionUrn, {
                        onSuccess: () => toast({ variant: 'success', title: 'Finalized' }),
                        onError: (e) => toast({ variant: 'error', title: 'Finalize failed', description: String(e) })
                      })
                    }
                    loading={finalizeOrphan.isPending}
                  >
                    Finalize
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Confirm
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Delete this session?"
        description="The session and its transcript will be removed permanently. Exports are unaffected."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />

      <SessionWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

function SessionRow({
  session,
  onDelete,
  onExport,
  deleting,
  exporting
}: {
  session: SessionListEntryDto;
  onDelete: () => void;
  onExport: () => void;
  deleting: boolean;
  exporting: boolean;
}) {
  return (
    <li className="group flex items-center justify-between gap-3 border-b border-border transition-colors last:border-b-0 hover:bg-secondary">
      <Link to="/sessions/$urn" params={{ urn: session.urn }} className="flex flex-1 items-center gap-3 px-3 py-2.5 min-w-0">
        <div className="flex size-7 shrink-0 items-center justify-center border border-border text-muted-foreground">
          <HistoryIcon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {truncate(session.summary, 80) ||
                truncate(session.jdSnippet, 80) ||
                `Session ${session.id.slice(0, 8)}`}
            </span>
            {session.dominantProviderLabel && (
              <Badge variant="outline">{session.dominantProviderLabel}</Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{formatRelativeTime(session.startedAt)}</span>
            <span>·</span>
            <span>{session.turnCount} turns</span>
            {session.tags && session.tags.length > 0 && (
              <>
                <span>·</span>
                <Tag className="size-3" />
                <span>{session.tags.join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-0.5 pr-1">
        <Button variant="ghost" size="icon" aria-label="Export" onClick={onExport} loading={exporting}>
          <Download className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete} loading={deleting}>
          <Trash2 className="size-3.5" />
        </Button>
        <Link
          to="/sessions/$urn"
          params={{ urn: session.urn }}
          aria-label="Open"
          className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </li>
  );
}