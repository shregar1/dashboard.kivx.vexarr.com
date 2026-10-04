import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { DataPanel } from '@/features/settings-data/DataPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'data',
  component: DataPage
});

function DataPage() {
  return (
    <>
      <PageHeader
        title="Data"
        description="Back up, restore, and clean up your session history. Sessions are stored locally in SQLite."
      />
      <DataPanel />
    </>
  );
}