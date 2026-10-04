import { Link } from '@tanstack/react-router';
import {
  Settings,
  History,
  Sparkles,
  Activity,
  Bug,
  Cpu,
  ChevronLeft,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/ui-store';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: 'main' | 'debug';
}

const NAV: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: Settings, group: 'main' },
  { to: '/sessions', label: 'Sessions', icon: History, group: 'main' },
  { to: '/personality', label: 'Personality', icon: Sparkles, group: 'main' },
  { to: '/diagnostics', label: 'Diagnostics', icon: Activity, group: 'main' },
  { to: '/diagnostics/bug-report', label: 'Bug report', icon: Bug, group: 'debug' },
  { to: '/diagnostics/processes', label: 'Processes', icon: Cpu, group: 'debug' }
];

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  const devMode = useUi((s) => s.devMode);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        'transition-[width] duration-150',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-sm font-bold text-white">
          K
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">KivX</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dashboard
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {NAV.filter((n) => n.group === 'main' || devMode).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-foreground"
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {devMode && (
          <>
            {!collapsed && (
              <div className="mt-6 mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Debug
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {NAV.filter((n) => n.group === 'debug').map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-foreground"
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-foreground'
          )}
        >
          <ChevronLeft
            className={cn('size-4 shrink-0 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}