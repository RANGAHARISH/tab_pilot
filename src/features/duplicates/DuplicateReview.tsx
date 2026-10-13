import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, Trash2, Globe, Shield, RefreshCw } from 'lucide-react';
import type { BrowserTab, DuplicateGroup } from '../../domain/types';
import type { DuplicateRetentionRule } from '../../services/duplicate-service';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface DuplicateReviewProps {
  exactGroups: DuplicateGroup[];
  likelyGroups: DuplicateGroup[];
  totalDuplicatesCount: number;
  onCloseDuplicates: (
    groups: DuplicateGroup[],
    rule: DuplicateRetentionRule,
    allowClosingPinned: boolean
  ) => void;
  onRefresh?: () => void;
}

export function DuplicateReview({
  exactGroups,
  likelyGroups,
  totalDuplicatesCount,
  onCloseDuplicates,
  onRefresh,
}: DuplicateReviewProps) {
  const [retentionRule, setRetentionRule] = useState<DuplicateRetentionRule>('keep-active');
  const [allowClosingPinned, setAllowClosingPinned] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTabType, setActiveTabType] = useState<'exact' | 'likely'>('exact');

  if (totalDuplicatesCount === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Zero duplicates found"
        description="All your open browser tabs point to unique destinations."
        actionText="Scan Again"
        onAction={onRefresh}
      />
    );
  }

  const currentGroups = activeTabType === 'exact' ? exactGroups : likelyGroups;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Duplicate Tabs Detected</span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              {totalDuplicatesCount} duplicates
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Safely close redundant tabs while keeping the active or oldest instance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Rescan tabs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Close {totalDuplicatesCount} Duplicates</span>
          </button>
        </div>
      </div>

      {/* Retention Strategy & Options Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="dup-rule" className="text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0">
              Retention Rule:
            </label>
            <select
              id="dup-rule"
              value={retentionRule}
              onChange={(e) => setRetentionRule(e.target.value as DuplicateRetentionRule)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
            >
              <option value="keep-active">Keep Active / Focused Tab (Recommended)</option>
              <option value="keep-oldest">Keep Oldest Tab (First opened)</option>
              <option value="keep-newest">Keep Newest Tab</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="protect-pinned"
              type="checkbox"
              checked={!allowClosingPinned}
              onChange={(e) => setAllowClosingPinned(!e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label
              htmlFor="protect-pinned"
              className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protect pinned tabs from being closed</span>
            </label>
          </div>
        </div>

        {/* Tab switch between exact and likely */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTabType('exact')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTabType === 'exact'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Exact Normalized Matches ({exactGroups.length} groups)
          </button>
          {likelyGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTabType('likely')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTabType === 'likely'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Likely Same Page ({likelyGroups.length} groups)
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {currentGroups.map((group, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {group.normalizedUrl}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                {group.tabs.length} tabs open
              </span>
            </div>

            <div className="space-y-2">
              {group.tabs.map((tab) => {
                const isKept = tab.id === group.primaryTabId;

                return (
                  <div
                    key={tab.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                      isKept
                        ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-850 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {tab.title}
                      </span>
                      {tab.active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                          Active
                        </span>
                      )}
                      {tab.pinned && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                          Pinned
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Window #{tab.windowId}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isKept
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                        }`}
                      >
                        {isKept ? 'Will Keep' : 'Will Close'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Close ${totalDuplicatesCount} duplicate tabs?`}
        description="Are you sure you want to close these redundant duplicate tabs? The primary tab in each group will remain open."
        confirmText="Close Duplicates"
        isDestructive={true}
        onConfirm={() => {
          onCloseDuplicates(
            [...exactGroups, ...likelyGroups],
            retentionRule,
            allowClosingPinned
          );
          setIsConfirmOpen(false);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
