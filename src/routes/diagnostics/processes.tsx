import { createRoute } from '@tanstack/react-router';
import { Cpu } from 'lucide-react';

import { Route as RootRoute } from '@/routes/__root';
import { PageHeader } from '@/components/layout/page';
import { Section, SectionRow, EmptyState } from '@/components/shared/section';
import { Badge } from '@/components/ui/badge';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'diagnostics/processes',
  component: ProcessesPage
});

function ProcessesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title="Process tree"
        description="Inspect the KivX host's process tree. Stealth settings (process tree sanitise, ghost mode, etc.) are managed under Settings → Telemetry."
        actions={
          <Badge variant="info" className="gap-1">
            <Cpu className="size-3" /> dev panel
          </Badge>
        }
      />

      <Section title="Active processes" description="Reflected from the desktop main process.">
        <EmptyState
          icon={<Cpu className="size-6" />}
          title="Process listing not enabled"
          description="Add a `processes:list` IPC handler to the desktop bridge to surface this data here."
        />
        <SectionRow label="Workaround" description="Use `ps aux | grep kiv` (macOS) or Task Manager (Windows).">
          <span className="font-mono text-xs text-muted-foreground">see runbook</span>
        </SectionRow>
      </Section>
    </div>
  );
}