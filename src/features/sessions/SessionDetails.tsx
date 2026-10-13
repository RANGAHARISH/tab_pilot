import React, { useState } from 'react';
import { X, ExternalLink, Globe, Trash2, Calendar, CheckSquare, Square } from 'lucide-react';
import type { Session } from '../../domain/types';
import { formatDateTime } from '../../lib/date-utils';

interface SessionDetailsProps {
  session: Session | null;
  onClose: () => void;
  onRestoreTabs: (tabsToRestore: string[], openInNewWindow: boolean) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function SessionDetails({
  session,
  onClose,
  onRestoreTabs,
  onDeleteSession,
}: SessionDetailsProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  if (!session) return null;

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === session.tabs.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(session.tabs.map((t) => t.url)));
    }
  };

  const handleRestoreSelected = (openInNewWindow: boolean) => {
    const urls = Array.from(selectedUrls);
    if (urls.length > 0) {
      onRestoreTabs(urls, openInNewWindow);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="session-details-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {session.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Saved on {formatDateTime(session.createdAt)}</span>
              <span>•</span>
              <span>{session.tabCount} tabs</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session details"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            {selectedUrls.size === session.tabs.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All</span>
          </button>

          <div className="flex items-center gap-2">
            {selectedUrls.size > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRestoreSelected(false)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-2xs"
                >
                  Restore Selected ({selectedUrls.size})
                </button>
                <button
                  type="button"
                  onClick={() => handleRestoreSelected(true)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Restore in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onRestoreTabs(session.tabs.map((t) => t.url), false)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-2xs"
                >
                  Restore All Tabs
                </button>
                <button
                  type="button"
                  onClick={() => onRestoreTabs(session.tabs.map((t) => t.url), true)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Restore all in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {session.tabs.map((tab) => (
            <div
              key={tab.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedUrls.has(tab.url)}
                onChange={() => toggleSelect(tab.url)}
                aria-label={`Select ${tab.title}`}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
              />
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{tab.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{tab.url}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {onDeleteSession && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onDeleteSession(session.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Session</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
