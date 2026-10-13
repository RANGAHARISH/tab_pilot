import React from 'react';
import { BookmarkPlus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SyncStatus } from './SyncStatus';
import type { Workspace, SyncStatusType } from '../domain/types';
import type { SearchContentType } from '../services/search-service';

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchType: SearchContentType;
  onSearchTypeChange: (type: SearchContentType) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string | null) => void;
  onNewWorkspace?: () => void;
  syncStatus: SyncStatusType;
  lastSyncedAt?: string | null;
  onSyncClick?: () => void;
  onQuickSaveSession?: () => void;
}

export function Topbar({
  searchQuery,
  onSearchChange,
  searchType,
  onSearchTypeChange,
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onNewWorkspace,
  syncStatus,
  lastSyncedAt,
  onSyncClick,
  onQuickSaveSession,
}: TopbarProps) {
  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
      <div className="flex-1 max-w-xl">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          selectedType={searchType}
          onTypeChange={onSearchTypeChange}
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={onWorkspaceSelect}
          onCreateNew={onNewWorkspace}
        />

        <SyncStatus
          status={syncStatus}
          lastSyncedAt={lastSyncedAt}
          onSyncClick={onSyncClick}
        />

        {onQuickSaveSession && (
          <button
            type="button"
            onClick={onQuickSaveSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Window</span>
          </button>
        )}
      </div>
    </header>
  );
}
