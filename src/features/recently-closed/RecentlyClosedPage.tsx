import React from 'react';
import { Compass, RotateCcw, Globe, AppWindow, Clock } from 'lucide-react';
import type { RecentlyClosedItem } from '../../domain/types';
import { formatRelativeTime } from '../../lib/date-utils';
import { EmptyState } from '../../components/EmptyState';

interface RecentlyClosedPageProps {
  items: RecentlyClosedItem[];
  onRestore: (sessionId: string) => void;
  onRefresh?: () => void;
}

export function RecentlyClosedPage({ items, onRestore, onRefresh }: RecentlyClosedPageProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="No recently closed tabs"
        description="Tabs closed in your browser will appear here for one-click recovery."
        actionText="Check Again"
        onAction={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recently Closed ({items.length})
          </h2>
          <p className="text-xs text-slate-400">
            Restore tabs and windows that were accidentally closed during this browsing session.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-2xs transition-shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                {item.type === 'window' ? (
                  <AppWindow className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  {item.url && <span className="truncate max-w-sm">{item.url}</span>}
                  {item.tabCount && <span>{item.tabCount} tabs</span>}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.closedAt)}
                  </span>
                </div>
              </div>
            </div>

            {item.sessionId && (
              <button
                type="button"
                onClick={() => onRestore(item.sessionId!)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
