import React, { useState } from 'react';
import { Pin, X, ExternalLink, Globe, Copy, Check } from 'lucide-react';
import type { BrowserTab } from '../domain/types';
import { extractDomain } from '../lib/url-utils';

interface TabRowProps {
  tab: BrowserTab;
  isSelected: boolean;
  onSelectToggle: (tabId: number) => void;
  onActivate: (tabId: number, windowId?: number) => void;
  onClose: (tabId: number) => void;
  onTogglePin?: (tabId: number, currentPinned: boolean) => void;
}

export function TabRow({
  tab,
  isSelected,
  onSelectToggle,
  onActivate,
  onClose,
  onTogglePin,
}: TabRowProps) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const domain = extractDomain(tab.url);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tab.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all duration-150 ${
        isSelected
          ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60'
          : tab.active
          ? 'bg-white border-blue-400 dark:bg-slate-900 dark:border-blue-700 shadow-xs'
          : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelectToggle(tab.id)}
        aria-label={`Select ${tab.title}`}
        className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer shrink-0"
      />

      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {tab.favIconUrl && !imgError ? (
          <img
            src={tab.favIconUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-4 h-4 object-contain rounded-xs"
          />
        ) : (
          <Globe className="w-4 h-4 text-slate-400" />
        )}
      </div>

      <div
        onClick={() => onActivate(tab.id, tab.windowId)}
        className="flex-1 min-w-0 cursor-pointer flex flex-col justify-center"
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-medium truncate ${
              tab.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {tab.title || 'Untitled'}
          </span>
          {tab.active && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" title="Active Tab" />
          )}
          {tab.pinned && (
            <span title="Pinned Tab">
              <Pin className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="truncate">{domain}</span>
          {tab.incognito && <span className="text-[10px] uppercase font-semibold text-purple-500">Incognito</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={copyUrl}
          title={copied ? 'Copied URL!' : 'Copy URL'}
          aria-label={copied ? 'Copied URL' : 'Copy tab URL'}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(tab.id, tab.pinned);
            }}
            title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
            aria-label={tab.pinned ? 'Unpin tab' : 'Pin tab'}
            className={`p-1 rounded transition-colors ${
              tab.pinned
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onActivate(tab.id, tab.windowId);
          }}
          title="Switch to tab"
          aria-label="Switch to tab"
          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.id);
          }}
          title="Close tab"
          aria-label={`Close tab ${tab.title}`}
          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
