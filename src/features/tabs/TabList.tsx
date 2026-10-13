import React, { useState } from 'react';
import { Layers, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { TabRow } from '../../components/TabRow';
import { TabActions } from './TabActions';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { BrowserTab } from '../../domain/types';

interface TabListProps {
  tabs: BrowserTab[];
  onActivate: (tabId: number, windowId?: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseTabs: (tabIds: number[]) => void;
  onTogglePin?: (tabId: number, currentPinned: boolean) => void;
  onSaveSession: (tabIds: number[]) => void;
  onGroupTabs: (tabIds: number[]) => void;
  onRefresh?: () => void;
  isExtensionActive?: boolean;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
}

export function TabList({
  tabs,
  onActivate,
  onCloseTab,
  onCloseTabs,
  onTogglePin,
  onSaveSession,
  onGroupTabs,
  onRefresh,
  isExtensionActive,
  isDemoMode,
  onToggleDemoMode,
}: TabListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const toggleSelect = (tabId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tabs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tabs.map((t) => t.id)));
    }
  };

  const handleCloseSelected = () => {
    setIsConfirmCloseOpen(true);
  };

  const confirmCloseSelected = () => {
    const ids = Array.from(selectedIds);
    onCloseTabs(ids);
    setSelectedIds(new Set());
    setIsConfirmCloseOpen(false);
  };

  if (tabs.length === 0) {
    if (!isExtensionActive && !isDemoMode) {
      return (
        <EmptyState
          icon={Layers}
          title="No live browser tabs detected"
          description="Websites hosted on the internet cannot scrape or access open browser windows due to browser security sandboxes. Load the extension in chrome://extensions to manage your real tabs, or test the UI with sample demo tabs."
          actionText={onToggleDemoMode ? "Explore Demo Tabs" : "Refresh Tabs"}
          onAction={onToggleDemoMode || onRefresh}
        />
      );
    }

    return (
      <EmptyState
        icon={Layers}
        title="No tabs open"
        description="There are currently no browser tabs open matching your criteria."
        actionText="Refresh Tabs"
        onAction={onRefresh}
      />
    );
  }

  // Group tabs by windowId
  const windowMap = new Map<number, BrowserTab[]>();
  for (const t of tabs) {
    const list = windowMap.get(t.windowId) || [];
    list.push(t);
    windowMap.set(t.windowId, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {selectedIds.size === tabs.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.size === tabs.length ? 'Deselect All' : `Select All (${tabs.length})`}
            </span>
          </button>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded"
            title="Refresh open tabs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {Array.from(windowMap.entries()).map(([windowId, winTabs], idx) => (
          <div key={windowId} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Window {idx + 1}</span>
              <span>•</span>
              <span>{winTabs.length} tabs</span>
            </div>

            <div className="space-y-1.5">
              {winTabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  isSelected={selectedIds.has(tab.id)}
                  onSelectToggle={toggleSelect}
                  onActivate={onActivate}
                  onClose={onCloseTab}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TabActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onSaveAsSession={() => onSaveSession(Array.from(selectedIds))}
        onGroupTabs={() => onGroupTabs(Array.from(selectedIds))}
        onCloseSelected={handleCloseSelected}
      />

      <ConfirmDialog
        isOpen={isConfirmCloseOpen}
        title={`Close ${selectedIds.size} tabs?`}
        description="Are you sure you want to close the selected tabs? This action cannot be undone unless recovered via recently closed tabs."
        confirmText="Close Tabs"
        isDestructive={true}
        onConfirm={confirmCloseSelected}
        onCancel={() => setIsConfirmCloseOpen(false)}
      />
    </div>
  );
}
