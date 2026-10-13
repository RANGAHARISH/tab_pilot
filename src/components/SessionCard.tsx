import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  Globe,
} from 'lucide-react';
import type { Session } from '../domain/types';
import { formatRelativeTime } from '../lib/date-utils';

interface SessionCardProps {
  session: Session;
  onRestore: (sessionId: string, openInNewWindow: boolean) => void;
  onRename?: (sessionId: string) => void;
  onDuplicate?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

export function SessionCard({
  session,
  onRestore,
  onRename,
  onDuplicate,
  onDelete,
}: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {session.name}
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {session.tabCount} {session.tabCount === 1 ? 'tab' : 'tabs'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeTime(session.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onRestore(session.id, false)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={() => onRestore(session.id, true)}
            title="Restore in new browser window"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {onRename && (
            <button
              type="button"
              onClick={() => onRename(session.id)}
              title="Rename session"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(session.id)}
              title="Duplicate session"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(session.id)}
              title="Delete session"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {session.tabs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isExpanded ? 'Hide tabs preview' : `Preview tabs (${session.tabs.length})`}</span>
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {session.tabs.map((tab, idx) => (
                <div
                  key={tab.id || idx}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-850 text-xs text-slate-700 dark:text-slate-300"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 font-medium">{tab.title || tab.url}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{tab.domain}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
