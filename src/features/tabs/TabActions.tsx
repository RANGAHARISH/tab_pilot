import React from 'react';
import { BookmarkPlus, FolderPlus, X, Trash2 } from 'lucide-react';

interface TabActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSaveAsSession: () => void;
  onGroupTabs: () => void;
  onCloseSelected: () => void;
}

export function TabActions({
  selectedCount,
  onClearSelection,
  onSaveAsSession,
  onGroupTabs,
  onCloseSelected,
}: TabActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 dark:border-slate-300 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-slate-700 dark:bg-slate-300" />

      <button
        type="button"
        onClick={onSaveAsSession}
        className="flex items-center gap-1.5 text-xs font-medium hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
        <span>Save Session</span>
      </button>

      <button
        type="button"
        onClick={onGroupTabs}
        className="flex items-center gap-1.5 text-xs font-medium hover:text-blue-400 dark:hover:text-blue-600 transition-colors"
      >
        <FolderPlus className="w-3.5 h-3.5" />
        <span>Group</span>
      </button>

      <button
        type="button"
        onClick={onCloseSelected}
        className="flex items-center gap-1.5 text-xs font-medium text-rose-400 dark:text-rose-600 hover:text-rose-300 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Close</span>
      </button>

      <div className="h-4 w-px bg-slate-700 dark:bg-slate-300" />

      <button
        type="button"
        onClick={onClearSelection}
        aria-label="Clear selection"
        className="p-1 text-slate-400 hover:text-white dark:hover:text-black rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
