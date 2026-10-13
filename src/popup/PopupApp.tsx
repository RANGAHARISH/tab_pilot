import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookmarkPlus,
  ExternalLink,
  Sparkles,
  Copy,
  Search,
  X,
  Globe,
  Check,
  RotateCcw,
} from 'lucide-react';
import { tabService } from '../services/tab-service';
import { sessionService } from '../services/session-service';
import { duplicateService } from '../services/duplicate-service';
import { aiService } from '../services/ai-service';
import { settingsService } from '../services/settings-service';
import { indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { extractDomain } from '../lib/url-utils';
import type { BrowserTab, Session, DuplicateGroup } from '../domain/types';

export function PopupApp() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [exactGroups, setExactGroups] = useState<DuplicateGroup[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await indexedDbAdapter.init();
        const prefs = await settingsService.getPreferences();
        settingsService.applyTheme(prefs.theme);

        const [openTabs, allSessions] = await Promise.all([
          tabService.getOpenTabs({ currentWindow: true }),
          sessionService.getAllSessions(),
        ]);

        setTabs(openTabs);
        setSessions(allSessions.slice(0, 3));

        const dupRes = await duplicateService.findDuplicates(openTabs);
        setDuplicateCount(dupRes.totalDuplicatesCount);
        setExactGroups(dupRes.exactGroups);
      } catch (err) {
        console.error('Popup init failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleOpenDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const url = chrome.runtime.getURL('dashboard.html');
      chrome.tabs.create({ url });
    } else {
      window.open('/dashboard.html', '_blank');
    }
  };

  const handleActivateTab = async (tabId: number, windowId?: number) => {
    await tabService.activateTab(tabId, windowId);
    window.close();
  };

  const handleCloseTab = async (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await tabService.closeTabs([tabId]);
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    showStatus('Tab closed');
  };

  const handleSaveCurrentWindow = async () => {
    try {
      const sess = await sessionService.saveSession({ currentWindowOnly: true });
      setSessions((prev) => [sess, ...prev.slice(0, 2)]);
      showStatus(`Saved "${sess.name}"`);
    } catch (err) {
      showStatus('Failed to save session');
    }
  };

  const handleCleanDuplicates = async () => {
    try {
      const res = await duplicateService.closeDuplicates(exactGroups, 'keep-active', false);
      showStatus(`Closed ${res.closedCount} duplicate tabs`);
      const updated = await tabService.getOpenTabs({ currentWindow: true });
      setTabs(updated);
      setDuplicateCount(0);
      setExactGroups([]);
    } catch (err) {
      showStatus('Failed to close duplicates');
    }
  };

  const handleSmartGroup = async () => {
    try {
      const suggestions = await aiService.suggestCategories(tabs);
      if (suggestions.length === 0) {
        showStatus('No group clusters found');
        return;
      }
      for (const s of suggestions) {
        await aiService.applySuggestionAsGroup(s);
      }
      showStatus(`Created ${suggestions.length} tab groups`);
    } catch (err) {
      showStatus('Grouping failed');
    }
  };

  const handleRestoreSession = async (sessionId: string) => {
    try {
      showStatus('Restoring session...');
      const res = await sessionService.restoreSession(sessionId, { openInNewWindow: false });
      showStatus(`Restored ${res.restoredCount} tabs`);
      const updated = await tabService.getOpenTabs({ currentWindow: true });
      setTabs(updated);
    } catch (err) {
      showStatus('Restore failed');
    }
  };

  const filteredTabs = tabs.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[380px] max-h-[580px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Header */}
      <header className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
            TP
          </div>
          <span className="font-bold text-sm tracking-tight">TabPilot</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            {tabs.length} tabs
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenDashboard}
          title="Open full TabPilot dashboard"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
        >
          <span>Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Quick Action Toolbar */}
      <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 shrink-0 text-xs">
        <button
          type="button"
          onClick={handleSaveCurrentWindow}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-2xs transition-colors"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Save Window</span>
        </button>

        <button
          type="button"
          onClick={handleSmartGroup}
          title="Group tabs automatically"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Organize</span>
        </button>

        {duplicateCount > 0 && (
          <button
            type="button"
            onClick={handleCleanDuplicates}
            title={`Close ${duplicateCount} duplicate tabs`}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Clean ({duplicateCount})</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2.5 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search open tabs..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Status toast in popup */}
      {statusMessage && (
        <div className="mx-2.5 mb-1.5 py-1 px-2.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 text-[11px] font-medium text-center animate-in fade-in">
          {statusMessage}
        </div>
      )}

      {/* Tabs list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2 space-y-1">
        {filteredTabs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No tabs found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleActivateTab(tab.id, tab.windowId)}
              className={`group flex items-center justify-between gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors border ${
                tab.active
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200'
                  : 'bg-white hover:bg-slate-100 border-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                {tab.favIconUrl ? (
                  <img src={tab.favIconUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0 rounded-2xs" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="truncate font-medium">{tab.title}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 group-hover:hidden">
                  {extractDomain(tab.url)}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  title="Close tab"
                  className="hidden group-hover:flex p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer: Quick restore recent sessions */}
      {sessions.length > 0 && (
        <footer className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Recent Sessions
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleRestoreSession(s.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:hover:text-blue-400 rounded-md whitespace-nowrap transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[100px]">{s.name}</span>
                <span className="text-[10px] text-slate-400">({s.tabCount})</span>
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
