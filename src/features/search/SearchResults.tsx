import React from 'react';
import { Search, Layers, Clock, Bookmark, FolderKanban, ExternalLink } from 'lucide-react';
import type { SearchResultItem } from '../../services/search-service';
import { EmptyState } from '../../components/EmptyState';
import type { BrowserTab, Session, TabRecord, Workspace } from '../../domain/types';

interface SearchResultsProps {
  query: string;
  results: SearchResultItem[];
  onActivateTab: (tabId: number, windowId?: number) => void;
  onOpenUrl: (url: string) => void;
  onRestoreSession: (sessionId: string, openInNewWindow: boolean) => void;
  onSelectWorkspace: (workspaceId: string) => void;
}

export function SearchResults({
  query,
  results,
  onActivateTab,
  onOpenUrl,
  onRestoreSession,
  onSelectWorkspace,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description={`No open tabs, sessions, or workspaces matched "${query}".`}
      />
    );
  }

  const getIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'open_tab':
        return Layers;
      case 'session':
        return Clock;
      case 'saved_tab':
        return Bookmark;
      case 'workspace':
        return FolderKanban;
    }
  };

  const getBadgeColor = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'open_tab':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      case 'session':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      case 'saved_tab':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'workspace':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
    }
  };

  const getDisplayLabel = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'open_tab':
        return 'Open Tab';
      case 'session':
        return 'Session';
      case 'saved_tab':
        return 'Saved Tab';
      case 'workspace':
        return 'Workspace';
    }
  };

  const handleAction = (item: SearchResultItem) => {
    switch (item.type) {
      case 'open_tab': {
        const tab = item.rawItem as BrowserTab;
        onActivateTab(tab.id, tab.windowId);
        break;
      }
      case 'session': {
        const sess = item.rawItem as Session;
        onRestoreSession(sess.id, false);
        break;
      }
      case 'saved_tab': {
        const tab = item.rawItem as TabRecord;
        onOpenUrl(tab.url);
        break;
      }
      case 'workspace': {
        const ws = item.rawItem as Workspace;
        onSelectWorkspace(ws.id);
        break;
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
        <span>Found {results.length} results</span>
        <span>Ranked by relevance</span>
      </div>

      <div className="space-y-2">
        {results.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={item.id}
              onClick={() => handleAction(item)}
              className="group flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeColor(item.type)}`}>
                      {getDisplayLabel(item.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                    {item.domain && <span>{item.domain}</span>}
                    {item.metadata && (
                      <>
                        <span>•</span>
                        <span>{item.metadata}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
