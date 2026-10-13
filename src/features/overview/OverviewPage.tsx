import React from 'react';
import {
  Layers,
  Clock,
  FolderKanban,
  Copy,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { BrowserTab, Session, Workspace, DuplicateGroup, AISuggestion } from '../../domain/types';
import { SessionCard } from '../../components/SessionCard';
import { TabRow } from '../../components/TabRow';

interface OverviewPageProps {
  openTabs: BrowserTab[];
  sessions: Session[];
  workspaces: Workspace[];
  duplicateCount: number;
  suggestions: AISuggestion[];
  onNavigate: (view: any) => void;
  onActivateTab: (tabId: number, windowId?: number) => void;
  onCloseTab: (tabId: number) => void;
  onRestoreSession: (sessionId: string, openInNewWindow: boolean) => void;
  onQuickSaveSession: () => void;
}

export function OverviewPage({
  openTabs,
  sessions,
  workspaces,
  duplicateCount,
  suggestions,
  onNavigate,
  onActivateTab,
  onCloseTab,
  onRestoreSession,
  onQuickSaveSession,
}: OverviewPageProps) {
  // Stat cards
  const stats = [
    {
      label: 'Open Tabs',
      value: openTabs.length,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300',
      action: () => onNavigate('tabs'),
    },
    {
      label: 'Workspaces',
      value: workspaces.length,
      icon: FolderKanban,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300',
      action: () => onNavigate('workspaces'),
    },
    {
      label: 'Saved Sessions',
      value: sessions.length,
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300',
      action: () => onNavigate('sessions'),
    },
    {
      label: 'Duplicates',
      value: duplicateCount,
      icon: Copy,
      color:
        duplicateCount > 0
          ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300'
          : 'text-slate-400 bg-slate-100 dark:bg-slate-800',
      action: () => onNavigate('duplicates'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              onClick={s.action}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Duplicate Alert Banner if duplicates exist */}
      {duplicateCount > 0 && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {duplicateCount} duplicate tabs detected
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                You have tabs pointing to identical URLs open across your windows.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('duplicates')}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs shrink-0"
          >
            Review Duplicates
          </button>
        </div>
      )}

      {/* Grid: Recent Sessions & Active Open Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Recent Sessions</span>
            </h3>

            <button
              type="button"
              onClick={() => onNavigate('sessions')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
              <p className="text-xs text-slate-400">No sessions saved yet.</p>
              <button
                type="button"
                onClick={onQuickSaveSession}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Save Current Window
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 3).map((sess) => (
                <SessionCard
                  key={sess.id}
                  session={sess}
                  onRestore={onRestoreSession}
                />
              ))}
            </div>
          )}
        </div>

        {/* Active Tabs Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Active Tabs ({openTabs.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => onNavigate('tabs')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {openTabs.slice(0, 6).map((tab) => (
              <TabRow
                key={tab.id}
                tab={tab}
                isSelected={false}
                onSelectToggle={() => {}}
                onActivate={onActivateTab}
                onClose={onCloseTab}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
