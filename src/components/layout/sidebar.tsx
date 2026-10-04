import { Link } from '@tanstack/react-router';
import {
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/ui-store';

import { usePageNav, type NavItem } from './page-nav-context';
import { ProfileMenu } from './profile-menu';

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  const pageNav = usePageNav();

  // Group items by their `group` field (defaults to "main"). Lets a
  // page declare debug items that render in a second section.
  const groups = groupItems(pageNav?.items ?? []);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        'transition-[width] duration-150',
        collapsed ? 'w-[200px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-2">
        <Link
          to="/"
          className="flex size-7 shrink-0 items-center justify-center bg-foreground font-mono text-sm font-bold text-background"
          aria-label="KivX — Home"
        >
          K
        </Link>
        {!collapsed && (
          <div className="flex flex-1 flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">KivX</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dashboard
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>
      </div>

      {/* Per-page nav — set by the active route via PageNavProvider.
          Renders nothing when the page doesn't declare its own nav. */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {pageNav && pageNav.items.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pageNav.title && !collapsed && (
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {pageNav.title}
              </div>
            )}
            <NavList items={groups.main} />
            {groups.debug.length > 0 && (
              <>
                {!collapsed && (
                  <div className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Debug
                  </div>
                )}
                <NavList items={groups.debug} />
              </>
            )}
          </div>
        ) : (
          !collapsed && (
            <p className="px-2 text-xs text-muted-foreground">No section selected.</p>
          )
        )}
      </nav>

      <div className="mt-auto">
        <ProfileMenu />
      </div>
    </aside>
  );
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={`${item.to}-${item.label}`}>
          <Link
            to={item.to}
            className="flex h-8 items-center gap-2.5 px-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-secondary hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:font-semibold"
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function groupItems(items: NavItem[]): { main: NavItem[]; debug: NavItem[] } {
  const main: NavItem[] = [];
  const debug: NavItem[] = [];
  for (const it of items) {
    if (it.group === 'debug') debug.push(it);
    else main.push(it);
  }
  return { main, debug };
}

void useUi;