import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import type { PageSummaryResult } from '../../domain/types';

interface PageSummaryProps {
  summary: PageSummaryResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function PageSummary({ summary, isLoading, onRefresh }: PageSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    const text = `${summary.title}\n\nSummary:\n${summary.summary}\n\nKey Points:\n${summary.keyPoints.map((p) => `- ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Active Tab AI Summary
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Summarizing...' : 'Summarize'}</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-6 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Extracting content and summarizing page...</p>
        </div>
      )}

      {!isLoading && summary && (
        <div className="space-y-3 text-xs">
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{summary.title}</h4>
            <p className="text-slate-400 truncate mt-0.5">{summary.url}</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            {summary.summary}
          </div>

          {summary.keyPoints.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Key Points:</span>
              <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 pl-1">
                {summary.keyPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isLoading && !summary && (
        <p className="text-xs text-slate-400 text-center py-4">
          Click &quot;Summarize&quot; to generate an instant executive summary of your active tab.
        </p>
      )}
    </div>
  );
}
