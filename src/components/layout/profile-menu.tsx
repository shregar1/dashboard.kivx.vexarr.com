import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  KeyRound,
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp
} from 'lucide-react';

import { Menu, MenuItem, MenuLabel, MenuLink, MenuSeparator, Avatar } from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/stores/profile-store';
import { useUi } from '@/stores/ui-store';
import { ipc } from '@/lib/ipc';
import { toast } from '@/stores/toast-store';
import { cn } from '@/lib/utils';

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise'
};

export function ProfileMenu() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.profile);
  const setProfile = useProfile((s) => s.setProfile);
  const signOut = useProfile((s) => s.signOut);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const [open, setOpen] = useState(false);

  // Use a fallback when the user is signed out / no real profile yet.
  const isSignedIn = Boolean(profile.email);
  const triggerLabel = isSignedIn ? profile.displayName : 'Sign in';
  const triggerAvatarLabel = isSignedIn
    ? profile.displayName
    : (profile.email || '?');

  return (
    <Menu
      trigger={
        <button
          type="button"
          aria-label={isSignedIn ? `${profile.displayName} — account menu` : 'Sign in'}
          className={cn(
            'flex w-full items-center gap-2.5 border-t border-sidebar-border p-2 text-left transition-colors hover:bg-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            open && 'bg-secondary'
          )}
        >
          <Avatar label={triggerAvatarLabel} size="md" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight">
                {triggerLabel}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {isSignedIn ? profile.email : 'Not signed in'}
              </div>
            </div>
          )}
          {!collapsed && <ChevronUp className="size-3.5 text-muted-foreground" />}
        </button>
      }
    >
      {/* Header — avatar + email + plan badge */}
      <div className="flex items-start gap-3 p-3">
        <Avatar label={triggerAvatarLabel} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {isSignedIn ? profile.displayName : 'Not signed in'}
            </span>
            {isSignedIn && (
              <Badge variant="outline">{PLAN_LABEL[profile.plan] ?? profile.plan}</Badge>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {profile.email || '—'}
          </div>
        </div>
      </div>

      <MenuSeparator />

      {/* Account */}
      <MenuLabel>Account</MenuLabel>
      <MenuItem
        onClick={() => {
          setOpen(false);
          void navigate({ to: '/settings' });
        }}
      >
        <Settings className="size-3.5" />
        Settings
      </MenuItem>

      <MenuSeparator />

      {/* Help */}
      <MenuLabel>Help</MenuLabel>
      <MenuItem
        onClick={() => {
          setOpen(false);
          void ipc.openExternal('https://kivx.ai/docs');
        }}
      >
        <HelpCircle className="size-3.5" />
        Documentation
      </MenuItem>

      <MenuSeparator />

      {/* Sign out */}
      <MenuItem
        onClick={() => {
          setOpen(false);
          signOut();
          toast({ variant: 'info', title: 'Signed out', description: 'Local profile cleared.' });
        }}
        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut className="size-3.5" />
        {isSignedIn ? 'Sign out' : 'Reset profile'}
      </MenuItem>
    </Menu>
  );
}
