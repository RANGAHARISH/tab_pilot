import React, { ReactNode } from 'react';
import { Sidebar, DashboardView } from './Sidebar';
import { Topbar } from './Topbar';
import type { Workspace, SyncStatusType, ThemeOption } from '../domain/types';
import type { SearchContentType } from '../services/search-service';

interface AppShellProps {
  children: ReactNode;
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  openTabCount?: number;
  sessionCount?: number;
  duplicateCount?: number;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string | null) => void;
  onNewWorkspace?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchType: SearchContentType;
  onSearchTypeChange: (type: SearchContentType) => void;
  syncStatus: SyncStatusType;
  lastSyncedAt?: string | null;
  onSyncClick?: () => void;
  onQuickSaveSession?: () => void;
  currentTheme?: ThemeOption;
  onToggleTheme?: (theme: ThemeOption) => void;
}

export function AppShell({
  children,
  currentView,
  onNavigate,
  openTabCount,
  sessionCount,
  duplicateCount,
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onNewWorkspace,
  searchQuery,
  onSearchChange,
  searchType,
  onSearchTypeChange,
  syncStatus,
  lastSyncedAt,
  onSyncClick,
  onQuickSaveSession,
  currentTheme,
  onToggleTheme,
}: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        openTabCount={openTabCount}
        sessionCount={sessionCount}
        duplicateCount={duplicateCount}
        currentTheme={currentTheme}
        onToggleTheme={onToggleTheme}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchType={searchType}
          onSearchTypeChange={onSearchTypeChange}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={onWorkspaceSelect}
          onNewWorkspace={onNewWorkspace}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          onSyncClick={onSyncClick}
          onQuickSaveSession={onQuickSaveSession}
        />

        <main className="flex-1 overflow-y-auto p-6 focus:outline-none" tabIndex={-1}>
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
