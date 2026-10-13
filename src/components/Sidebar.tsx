import React from 'react';
import {
  Layers,
  Copy,
  Clock,
  Sparkles,
  Settings,
  FolderKanban,
  Bookmark,
  Compass,
  LayoutDashboard,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import type { ThemeOption } from '../domain/types';

export type DashboardView =
  | 'overview'
  | 'tabs'
  | 'workspaces'
  | 'sessions'
  | 'saved'
  | 'duplicates'
  | 'recently_closed'
  | 'ai'
  | 'settings';

interface SidebarProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  openTabCount?: number;
  sessionCount?: number;
  duplicateCount?: number;
  currentTheme?: ThemeOption;
  onToggleTheme?: (theme: ThemeOption) => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  openTabCount = 0,
  sessionCount = 0,
  duplicateCount = 0,
  currentTheme = 'system',
  onToggleTheme,
}: SidebarProps) {
  const navItems: Array<{
    id: DashboardView;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tabs', label: 'Open Tabs', icon: Layers, badge: openTabCount },
    { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
    { id: 'sessions', label: 'Saved Sessions', icon: Clock, badge: sessionCount },
    { id: 'saved', label: 'Saved Tabs', icon: Bookmark },
    {
      id: 'duplicates',
      label: 'Duplicate Tabs',
      icon: Copy,
      badge: duplicateCount > 0 ? duplicateCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    { id: 'recently_closed', label: 'Recently Closed', icon: Compass },
    { id: 'ai', label: 'AI Organizer', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
          TP
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-tight">
            TabPilot
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Smart Tab Organizer</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor ||
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {onToggleTheme && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Theme</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => onToggleTheme('light')}
              title="Light theme"
              className={`p-1 rounded ${
                currentTheme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleTheme('dark')}
              title="Dark theme"
              className={`p-1 rounded ${
                currentTheme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleTheme('system')}
              title="System theme"
              className={`p-1 rounded ${
                currentTheme === 'system'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
