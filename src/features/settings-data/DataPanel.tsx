import { useState } from 'react';
import { Download, Upload, FileJson, FileText, AlertTriangle, Trash2 } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Confirm } from '@/components/ui/dialog';

import {
  useExportAllMarkdown,
  useExportSession,
  useSaveSessionJson,
  useSaveFilteredSessions,
  useImportSessionFile,
  useImportSessionsFiles,
  useDeleteAllSessions,
  useSessions
} from '@/api/queries';
import { toast } from '@/stores/toast-store';
import { formatBytes } from '@/lib/utils';

export function DataPanel() {
  const exportAll = useExportAllMarkdown();
  const deleteAll = useDeleteAllSessions();
  const sessions = useSessions();

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function downloadAllMarkdown() {
    try {
      const res = await exportAll.mutateAsync();
      const blob = new Blob([res.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kivx-sessions-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ variant: 'success', title: `Exported ${res.count} session${res.count === 1 ? '' : 's'}` });
    } catch (e) {
      toast({ variant: 'error', title: 'Export failed', description: String(e) });
    }
  }

  async function handleDeleteAll() {
    setConfirmDelete(false);
    try {
      const res = await deleteAll.mutateAsync();
      toast({ variant: 'warning', title: `Removed ${res.removed} session${res.removed === 1 ? '' : 's'}` });
    } catch (e) {
      toast({ variant: 'error', title: 'Delete failed', description: String(e) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Storage" description="Where session records live and how big the dataset is.">
        <SectionRow label="Sessions stored" description="Includes orphaned / not-yet-finalised sessions.">
          <div className="flex items-center gap-2">
            <Badge variant="info">{sessions.data?.length ?? 0}</Badge>
            <span className="text-xs text-muted-foreground">sessions</span>
          </div>
        </SectionRow>

        <SectionRow label="Database path" description="SQLite database backing the session store.">
          <span className="font-mono text-xs text-muted-foreground">~/.kiv/sessions.db</span>
        </SectionRow>
      </Section>

      <Section title="Export" description="Bundle your sessions for backup or sharing.">
        <SectionRow label="All sessions as Markdown" description="Human-readable, one session per heading.">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="size-3.5" />}
            onClick={downloadAllMarkdown}
            loading={exportAll.isPending}
          >
            Export all
          </Button>
        </SectionRow>

        <SectionRow label="All sessions as JSON bundle" description="KivX-format JSON bundle (kivx.sessions envelope).">
          <ExportJsonBundleButton />
        </SectionRow>

        <SectionRow label="Single session JSON" description="Export a single session from the Sessions page.">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast({ variant: 'info', title: 'Open a session from the Sessions page', description: 'Use the export action on a single session row.' })}
          >
            How?
          </Button>
        </SectionRow>
      </Section>

      <Section title="Import" description="Load sessions exported from another KivX install.">
        <SectionRow label="Import single session JSON" description="Pick one .json file from disk.">
          <ImportSingleButton />
        </SectionRow>

        <SectionRow label="Import multiple / bundle" description="Pick many .json files or a directory.">
          <ImportManyButton />
        </SectionRow>
      </Section>

      <Section
        title="Danger zone"
        description="Destructive actions. Confirm carefully."
      >
        <SectionRow
          label="Delete every session"
          description="Removes all session records from the local database. Cannot be undone."
        >
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="size-3.5" />}
            onClick={() => setConfirmDelete(true)}
            loading={deleteAll.isPending}
          >
            Delete all sessions
          </Button>
        </SectionRow>

        <SectionRow label="Force-orphan recovery" description="Find sessions with turns but no endedAt (e.g. force-quit).">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast({ variant: 'info', title: 'Visit the Sessions page', description: 'Use the Orphans panel there to recover.' })}
          >
            Open Sessions
          </Button>
        </SectionRow>
      </Section>

      <Confirm
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete every session?"
        description={
          <span className="text-sm text-muted-foreground">
            <AlertTriangle className="mr-1 inline size-3.5 text-warning" />
            This wipes the local SQLite database. Exported backups are unaffected.
          </span>
        }
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}

function ExportJsonBundleButton() {
  const save = useSaveFilteredSessions();
  const sessions = useSessions();
  const list = sessions.data ?? [];

  async function exportAll() {
    const urns = list.map((s) => s.urn);
    if (urns.length === 0) {
      toast({ variant: 'warning', title: 'No sessions to export.' });
      return;
    }
    try {
      const res = await save.mutateAsync(urns);
      if (res.ok) toast({ variant: 'success', title: `Saved ${res.count} session${res.count === 1 ? '' : 's'}` });
      else if (res.cancelled) toast({ variant: 'info', title: 'Cancelled' });
      else toast({ variant: 'error', title: 'Export failed', description: res.error });
    } catch (e) {
      toast({ variant: 'error', title: 'Export failed', description: String(e) });
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<FileJson className="size-3.5" />}
      onClick={exportAll}
      loading={save.isPending}
    >
      Export bundle
    </Button>
  );
}

function ImportSingleButton() {
  const importFile = useImportSessionFile();

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<Upload className="size-3.5" />}
      onClick={() => importFile.mutate(undefined)}
      loading={importFile.isPending}
    >
      Choose file…
    </Button>
  );
}

function ImportManyButton() {
  const importFiles = useImportSessionsFiles();

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<Upload className="size-3.5" />}
      onClick={() => importFiles.mutate(undefined)}
      loading={importFiles.isPending}
    >
      Choose files…
    </Button>
  );
}

void Download;
void formatBytes;