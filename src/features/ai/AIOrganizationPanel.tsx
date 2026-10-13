import React, { useState } from 'react';
import { Sparkles, FolderPlus, CheckCircle, Info, RefreshCw, Cpu } from 'lucide-react';
import type { AISuggestion, BrowserTab } from '../../domain/types';
import { EmptyState } from '../../components/EmptyState';

interface AIOrganizationPanelProps {
  suggestions: AISuggestion[];
  allTabs: BrowserTab[];
  isLoading: boolean;
  isAIConfigured: boolean;
  onGenerateSuggestions: () => void;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onApplyAllSuggestions: (suggestions: AISuggestion[]) => void;
}

export function AIOrganizationPanel({
  suggestions,
  allTabs,
  isLoading,
  isAIConfigured,
  onGenerateSuggestions,
  onApplySuggestion,
  onApplyAllSuggestions,
}: AIOrganizationPanelProps) {
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());

  const handleApply = (s: AISuggestion, idx: number) => {
    onApplySuggestion(s);
    setAppliedIndices((prev) => new Set(prev).add(idx));
  };

  const handleApplyAll = () => {
    onApplyAllSuggestions(suggestions);
    setAppliedIndices(new Set(suggestions.map((_, i) => i)));
  };

  const getTabTitle = (id: number) => {
    const found = allTabs.find((t) => t.id === id);
    return found ? found.title : `Tab #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Mode Banner */}
      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
        {isAIConfigured ? (
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        ) : (
          <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs space-y-1">
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            {isAIConfigured
              ? 'AI Smart Organization Active'
              : 'Local Rule-Based Clustering Active (Privacy Mode)'}
          </p>
          <p className="text-blue-700 dark:text-blue-300">
            {isAIConfigured
              ? 'Tab categories and group suggestions are generated via your configured AI proxy. No data is stored externally.'
              : 'Running 100% locally on your machine with deterministic heuristic clustering. No tab data or URLs leave your browser.'}
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Group Recommendations ({suggestions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Group related tabs into native Chrome tab groups with one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerateSuggestions}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Re-analyze Tabs'}</span>
          </button>

          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={isLoading || appliedIndices.size === suggestions.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Apply All Groups</span>
            </button>
          )}
        </div>
      </div>

      {suggestions.length === 0 && !isLoading && (
        <EmptyState
          icon={Sparkles}
          title="No group suggestions available"
          description="Open multiple related tabs, then trigger AI analysis to automatically identify logical clusters."
          actionText="Analyze Open Tabs"
          onAction={onGenerateSuggestions}
        />
      )}

      {/* Suggestions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((s, idx) => {
          const isApplied = appliedIndices.has(idx);

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isApplied
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {s.suggestedGroupName}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(s, idx)}
                  disabled={isApplied}
                  className={`px-3 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors shadow-2xs flex items-center gap-1 ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Grouped</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Tabs to group ({s.tabIds.length}):
                </span>
                <ul className="text-xs space-y-1 max-h-28 overflow-y-auto pr-1">
                  {s.tabIds.map((id) => (
                    <li key={id} className="text-slate-700 dark:text-slate-300 truncate">
                      • {getTabTitle(id)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
