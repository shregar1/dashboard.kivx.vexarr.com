import { createRoute } from '@tanstack/react-router';

import { Route as SettingsRoute } from '@/routes/settings/route';
import { PageHeader } from '@/components/layout/page';
import { VcamPanel } from '@/features/settings-camera/VcamPanel';

export const Route = createRoute({
  getParentRoute: () => SettingsRoute,
  path: 'camera',
  component: CameraPage
});

function CameraPage() {
  return (
    <>
      <PageHeader
        title="Virtual camera"
        description="Replace your webcam with a looped video, background blur, watermark, or PIP. The interviewer's call app sees a clean stream."
      />
      <VcamPanel />
    </>
  );
}