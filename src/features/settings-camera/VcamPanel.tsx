import { Camera, Play, Square, Video, Film, Image as ImageIcon, Palette, Type } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useVcamConfig, useSetVcamConfig, useVcamStatus } from '@/api/queries';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';

export function VcamPanel() {
  const config = useVcamConfig();
  const status = useVcamStatus();
  const setConfig = useSetVcamConfig();

  const cfg = (config.data ?? {}) as {
    mode?: 'off' | 'obs' | 'browser';
    autoStart?: boolean;
    loop?: boolean;
    width?: number;
    height?: number;
    fps?: number;
    audioPassthrough?: boolean;
    videoPath?: string;
    pipEnabled?: boolean;
    pipPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    pipSize?: number;
    previewWindow?: boolean;
    vcamToggleHotkey?: string;
  };

  function pick(kind: 'video' | 'background' | 'watermark' | 'playlist' | 'recording' | 'lut'): void {
    void (async () => {
      try {
        let path: string | null = null;
        let paths: string[] = [];
        switch (kind) {
          case 'video':
            path = await ipc.vcamSelectVideo();
            if (path) setConfig.mutate({ videoPath: path });
            break;
          case 'background':
            path = await ipc.vcamSelectBackground();
            if (path)
              setConfig.mutate({
                bgReplace: { ...(cfg as object & { bgReplace?: object }), enabled: false, backgroundPath: path } as never
              });
            break;
          case 'watermark':
            path = await ipc.vcamSelectWatermarkImage();
            if (path)
              setConfig.mutate({
                watermark: {
                  enabled: true,
                  imagePath: path,
                  type: 'image',
                  position: 'bottom-right',
                  opacity: 0.6
                }
              });
            break;
          case 'playlist':
            paths = await ipc.vcamSelectPlaylistFiles();
            if (paths.length > 0)
              setConfig.mutate({
                playlist: { enabled: true, files: paths, shuffle: false }
              });
            break;
          case 'recording':
            path = await ipc.vcamSelectRecordingDir();
            if (path)
              setConfig.mutate({
                recording: { enabled: true, outputDir: path }
              });
            break;
          case 'lut':
            path = await ipc.vcamSelectLut();
            if (path) setConfig.mutate({ lutPath: path });
            break;
        }
      } catch (e) {
        toast({ variant: 'error', title: 'Selection failed', description: String(e) });
      }
    })();
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Virtual camera" description="Replace your real webcam output with a video loop, scene rotation, or background-blurred feed.">
        <SectionRow label="Mode" description="Browser mode = local web video. OBS mode = external OBS Virtual Camera.">
          <Select
            value={cfg.mode ?? 'off'}
            onChange={(e) => setConfig.mutate({ mode: e.target.value as 'off' | 'obs' | 'browser' })}
            className="w-48"
          >
            <option value="off">Off</option>
            <option value="browser">Browser (local)</option>
            <option value="obs">OBS Virtual Camera</option>
          </Select>
        </SectionRow>

        <SectionRow label="Auto-start" description="Start the virtual camera when a session begins.">
          <Switch
            checked={Boolean(cfg.autoStart)}
            onCheckedChange={(v) => setConfig.mutate({ autoStart: v })}
          />
        </SectionRow>

        <SectionRow label="Loop video" description="Loop the source video when it reaches the end.">
          <Switch
            checked={Boolean(cfg.loop)}
            onCheckedChange={(v) => setConfig.mutate({ loop: v })}
          />
        </SectionRow>

        <SectionRow label="Audio passthrough" description="Pipe the source video's audio into the call.">
          <Switch
            checked={Boolean(cfg.audioPassthrough)}
            onCheckedChange={(v) => setConfig.mutate({ audioPassthrough: v })}
          />
        </SectionRow>

        <SectionRow label="Preview window" description="Show a small preview while configuring.">
          <Switch
            checked={Boolean(cfg.previewWindow)}
            onCheckedChange={(v) => setConfig.mutate({ previewWindow: v })}
          />
        </SectionRow>

        <SectionRow label="Status" description="Whether the virtual camera is currently running.">
          <StatusBadge data={status.data as { running?: boolean } | undefined} />
        </SectionRow>

        <SectionRow label="Toggle hotkey" description="Global hotkey to start / stop the virtual camera.">
          <Input
            value={cfg.vcamToggleHotkey ?? ''}
            placeholder="Cmd+Shift+V"
            onChange={(e) => setConfig.mutate({ vcamToggleHotkey: e.target.value })}
            className="w-48 font-mono text-xs"
          />
        </SectionRow>

        <SectionRow label="Start / stop" description="Manually control the virtual camera.">
          <div className="flex items-center gap-2">
            <Button size="sm" leftIcon={<Play className="size-3.5" />} onClick={() => ipc.vcamStart()}>
              Start
            </Button>
            <Button size="sm" variant="outline" leftIcon={<Square className="size-3.5" />} onClick={() => ipc.vcamStop()}>
              Stop
            </Button>
          </div>
        </SectionRow>
      </Section>

      <Section title="Source" description="The file or playlist that becomes the virtual camera output.">
        <SectionRow label="Video file" description="Pick a local video file to play.">
          <div className="flex items-center gap-2">
            <Input
              value={cfg.videoPath ?? ''}
              placeholder="/path/to/video.mp4"
              onChange={(e) => setConfig.mutate({ videoPath: e.target.value })}
              className="w-72 font-mono text-xs"
            />
            <Button variant="outline" size="sm" leftIcon={<Video className="size-3.5" />} onClick={() => pick('video')}>
              Choose
            </Button>
          </div>
        </SectionRow>

        <SectionRow label="Output size" description="Width and height in pixels (browser mode).">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={cfg.width ?? 1280}
              onChange={(e) => setConfig.mutate({ width: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-muted-foreground">×</span>
            <Input
              type="number"
              value={cfg.height ?? 720}
              onChange={(e) => setConfig.mutate({ height: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </SectionRow>

        <SectionRow label="Frame rate" description="Cap on output FPS.">
          <Slider
            value={cfg.fps ?? 30}
            onValueChange={(v) => setConfig.mutate({ fps: v })}
            min={1}
            max={60}
            step={1}
            formatValue={(v) => `${v} fps`}
            className="w-64"
          />
        </SectionRow>

        <SectionRow label="Playlist" description="Cycle through multiple sources.">
          <Button variant="outline" size="sm" leftIcon={<Film className="size-3.5" />} onClick={() => pick('playlist')}>
            Pick files
          </Button>
        </SectionRow>
      </Section>

      <Section title="Overlay" description="Background, watermark, lower-third, and PIP.">
        <SectionRow label="Background image" description="Replaces the real camera background (browser mode).">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<ImageIcon className="size-3.5" />} onClick={() => pick('background')}>
              Pick
            </Button>
            <Switch
              checked={Boolean((cfg as { bgReplace?: { enabled?: boolean } }).bgReplace?.enabled)}
              onCheckedChange={(v) =>
                setConfig.mutate({
                  bgReplace: { ...(cfg as { bgReplace?: object }), enabled: v } as never
                })
              }
            />
            <Label>enabled</Label>
          </div>
        </SectionRow>

        <SectionRow label="Watermark" description="Overlay a logo or text on the output.">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Type className="size-3.5" />} onClick={() => pick('watermark')}>
              Pick image
            </Button>
          </div>
        </SectionRow>

        <SectionRow label="PIP" description="Picture-in-picture over the video.">
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(cfg.pipEnabled)}
              onCheckedChange={(v) => setConfig.mutate({ pipEnabled: v })}
            />
            <Select
              value={cfg.pipPosition ?? 'top-right'}
              onChange={(e) =>
                setConfig.mutate({
                  pipPosition: e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
                })
              }
              className="w-36"
            >
              <option value="top-left">Top-left</option>
              <option value="top-right">Top-right</option>
              <option value="bottom-left">Bottom-left</option>
              <option value="bottom-right">Bottom-right</option>
            </Select>
          </div>
        </SectionRow>

        <SectionRow label="PIP size" description="Size as % of the larger side.">
          <Slider
            value={cfg.pipSize ?? 25}
            onValueChange={(v) => setConfig.mutate({ pipSize: v })}
            min={5}
            max={50}
            step={1}
            formatValue={(v) => `${v}%`}
            className="w-64"
          />
        </SectionRow>

        <SectionRow label="LUT" description="Color-grade the output with a .cube LUT file.">
          <Button variant="outline" size="sm" leftIcon={<Palette className="size-3.5" />} onClick={() => pick('lut')}>
            Pick .cube
          </Button>
        </SectionRow>

        <SectionRow label="Recording directory" description="Where looped video output is recorded.">
          <Button variant="outline" size="sm" onClick={() => pick('recording')}>
            Choose directory
          </Button>
        </SectionRow>
      </Section>
    </div>
  );
}

function StatusBadge({ data }: { data?: { running?: boolean } }) {
  if (!data) return <Badge variant="info">idle</Badge>;
  return data.running ? (
    <Badge variant="success">running</Badge>
  ) : (
    <Badge variant="warning">stopped</Badge>
  );
}

void Camera;