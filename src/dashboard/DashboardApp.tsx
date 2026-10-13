import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import type { DashboardView } from '../components/Sidebar';
import { OverviewPage } from '../features/overview/OverviewPage';
import { TabList } from '../features/tabs/TabList';
import { SessionList } from '../features/sessions/SessionList';
import { WorkspaceList } from '../features/workspaces/WorkspaceList';
import { SavedTabsPage } from '../features/saved/SavedTabsPage';
import { DuplicateReview } from '../features/duplicates/DuplicateReview';
import { RecentlyClosedPage } from '../features/recently-closed/RecentlyClosedPage';
import { AIOrganizationPanel } from '../features/ai/AIOrganizationPanel';
import { PageSummary } from '../features/ai/PageSummary';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SearchResults } from '../features/search/SearchResults';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../components/Toast';

import { tabService } from '../services/tab-service';
import { sessionService } from '../services/session-service';
import { workspaceService } from '../services/workspace-service';
import { duplicateService } from '../services/duplicate-service';
import { searchService, type SearchContentType, type SearchResultItem } from '../services/search-service';
import { aiService } from '../services/ai-service';
import { settingsService } from '../services/settings-service';
import { storageService } from '../services/storage-service';
import { syncService } from '../services/sync-service';
import { indexedDbAdapter } from '../adapters/indexeddb-adapter';

import type {
  BrowserTab,
  Session,
  Workspace,
  TabRecord,
  AISuggestion,
  PageSummaryResult,
  RecentlyClosedItem,
  UserPreferences,
  SyncStatusType,
  ThemeOption,
  DuplicateGroup,
} from '../domain/types';

export function DashboardApp() {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [openTabs, setOpenTabs] = useState<BrowserTab[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [savedTabs, setSavedTabs] = useState<TabRecord[]>([]);
  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosedItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    defaultWorkspaceId: null,
    autoSaveSessions: false,
    confirmBeforeClosingTabs: true,
    enableAI: false,
    enableCloudSync: false,
    syncIntervalMinutes: 15,
    reducedMotion: false,
  });

  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0, percentage: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [isExtensionActive, setIsExtensionActive] = useState<boolean>(() => tabService.isExtensionAvailable());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => tabService.getDemoMode());
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Duplicates
  const [exactGroups, setExactGroups] = useState<DuplicateGroup[]>([]);
  const [likelyGroups, setLikelyGroups] = useState<DuplicateGroup[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // AI
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [summary, setSummary] = useState<PageSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchContentType>('all');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      await indexedDbAdapter.init();

      const [tabs, allSessions, allWorkspaces, allSaved, recents, prefs, storageEst] =
        await Promise.all([
          tabService.getOpenTabs(),
          sessionService.getAllSessions(),
          workspaceService.getAllWorkspaces(),
          indexedDbAdapter.getAll<TabRecord>('saved_tabs'),
          tabService.getRecentlyClosed(),
          settingsService.getPreferences(),
          storageService.getStorageEstimate(),
        ]);

      setOpenTabs(tabs);
      setSessions(allSessions);
      setWorkspaces(allWorkspaces);
      setSavedTabs(allSaved);
      setRecentlyClosed(recents);
      setPreferences(prefs);
      setStorageUsage(storageEst);

      setIsExtensionActive(tabService.isExtensionAvailable());
      setIsDemoMode(tabService.getDemoMode());

      settingsService.applyTheme(prefs.theme);

      // Duplicates scan
      const dupResult = await duplicateService.findDuplicates(tabs);
      setExactGroups(dupResult.exactGroups);
      setLikelyGroups(dupResult.likelyGroups);
      setDuplicateCount(dupResult.totalDuplicatesCount);

      // Sync status
      const syncInfo = syncService.getStatus();
      setSyncStatus(syncInfo.status);
      setLastSyncedAt(syncInfo.lastSyncedAt);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Error loading extension data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live listen for Chrome tab and window changes
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const handleTabChange = () => {
        loadData();
      };
      chrome.tabs.onCreated.addListener(handleTabChange);
      chrome.tabs.onUpdated.addListener(handleTabChange);
      chrome.tabs.onRemoved.addListener(handleTabChange);
      if (chrome.windows) {
        chrome.windows.onCreated.addListener(handleTabChange);
        chrome.windows.onRemoved.addListener(handleTabChange);
      }
      return () => {
        chrome.tabs.onCreated.removeListener(handleTabChange);
        chrome.tabs.onUpdated.removeListener(handleTabChange);
        chrome.tabs.onRemoved.removeListener(handleTabChange);
        if (chrome.windows) {
          chrome.windows.onCreated.removeListener(handleTabChange);
          chrome.windows.onRemoved.removeListener(handleTabChange);
        }
      };
    }
  }, [loadData]);

  const handleToggleDemoMode = async () => {
    const nextMode = !isDemoMode;
    tabService.setDemoMode(nextMode);
    setIsDemoMode(nextMode);
    await loadData();
    showToast(
      nextMode ? 'Demo preview mode enabled with sample tabs' : 'Demo mode exited (no sample tabs)',
      'info'
    );
  };

  // Execute Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const runSearch = async () => {
      const results = await searchService.search(searchQuery, {
        contentType: searchType,
        workspaceId: activeWorkspaceId,
      });
      setSearchResults(results);
    };

    runSearch();
  }, [searchQuery, searchType, activeWorkspaceId]);

  // Tab operations
  const handleActivateTab = async (tabId: number, windowId?: number) => {
    try {
      await tabService.activateTab(tabId, windowId);
    } catch (err) {
      showToast('Could not activate tab', 'error');
    }
  };

  const handleCloseTab = async (tabId: number) => {
    try {
      await tabService.closeTabs([tabId]);
      setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
      showToast('Tab closed', 'info');
      loadData();
    } catch (err) {
      showToast('Failed to close tab', 'error');
    }
  };

  const handleCloseTabs = async (tabIds: number[]) => {
    try {
      await tabService.closeTabs(tabIds);
      setOpenTabs((prev) => prev.filter((t) => !tabIds.includes(t.id)));
      showToast(`Closed ${tabIds.length} tabs`, 'info');
      loadData();
    } catch (err) {
      showToast('Failed to close selected tabs', 'error');
    }
  };

  const handleTogglePin = async (tabId: number, currentPinned: boolean) => {
    try {
      await tabService.togglePin(tabId, currentPinned);
      setOpenTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, pinned: !currentPinned } : t))
      );
    } catch (err) {
      showToast('Failed to toggle pin', 'error');
    }
  };

  // Sessions
  const handleSaveCurrentWindow = async () => {
    try {
      const newSession = await sessionService.saveSession({
        workspaceId: activeWorkspaceId,
        currentWindowOnly: true,
      });
      setSessions((prev) => [newSession, ...prev]);
      showToast(`Saved session "${newSession.name}" (${newSession.tabCount} tabs)`, 'success');
    } catch (err) {
      showToast('Failed to save session', 'error');
    }
  };

  const handleSaveSelectedTabsAsSession = async (tabIds: number[]) => {
    try {
      const newSession = await sessionService.saveSession({
        workspaceId: activeWorkspaceId,
        tabIds,
      });
      setSessions((prev) => [newSession, ...prev]);
      showToast(`Saved session with ${tabIds.length} tabs`, 'success');
    } catch (err) {
      showToast('Failed to save session', 'error');
    }
  };

  const handleRestoreSession = async (sessionId: string, openInNewWindow: boolean) => {
    try {
      showToast('Restoring session...', 'info');
      const res = await sessionService.restoreSession(sessionId, { openInNewWindow });
      showToast(
        `Restored ${res.restoredCount} tabs (${res.skippedCount} skipped as duplicate)`,
        'success'
      );
      loadData();
    } catch (err) {
      showToast('Failed to restore session', 'error');
    }
  };

  const handleRestoreTabs = async (urls: string[], openInNewWindow: boolean) => {
    try {
      if (openInNewWindow && typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({ url: urls }, () => {});
      } else if (typeof chrome !== 'undefined' && chrome.tabs) {
        for (const url of urls) {
          chrome.tabs.create({ url, active: false });
        }
      }
      showToast(`Restored ${urls.length} tabs`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to restore tabs', 'error');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('Session deleted', 'info');
    } catch (err) {
      showToast('Failed to delete session', 'error');
    }
  };

  const handleRenameSession = async (sessionId: string, newName: string) => {
    try {
      const updated = await sessionService.renameSession(sessionId, newName);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      showToast('Session renamed', 'success');
    } catch (err) {
      showToast('Failed to rename session', 'error');
    }
  };

  const handleDuplicateSession = async (sessionId: string) => {
    try {
      const duplicated = await sessionService.duplicateSession(sessionId);
      setSessions((prev) => [duplicated, ...prev]);
      showToast('Session duplicated', 'success');
    } catch (err) {
      showToast('Failed to duplicate session', 'error');
    }
  };

  // Workspaces
  const handleSaveWorkspace = async (data: {
    id?: string;
    name: string;
    description: string;
    color: string;
    isDefault: boolean;
  }) => {
    try {
      if (data.id) {
        const updated = await workspaceService.updateWorkspace(data.id, data);
        setWorkspaces((prev) => prev.map((w) => (w.id === data.id ? updated : w)));
        showToast(`Workspace "${updated.name}" updated`, 'success');
      } else {
        const created = await workspaceService.createWorkspace(data);
        setWorkspaces((prev) => [...prev, created]);
        showToast(`Created workspace "${created.name}"`, 'success');
      }
    } catch (err) {
      showToast('Failed to save workspace', 'error');
    }
  };

  const handleDeleteWorkspace = async (id: string, moveToWorkspaceId?: string | null) => {
    try {
      await workspaceService.deleteWorkspace(id, moveToWorkspaceId);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkspaceId === id) setActiveWorkspaceId(null);
      showToast('Workspace deleted', 'info');
      loadData();
    } catch (err) {
      showToast('Failed to delete workspace', 'error');
    }
  };

  const handleSetDefaultWorkspace = async (id: string) => {
    try {
      await workspaceService.updateWorkspace(id, { isDefault: true });
      loadData();
      showToast('Default workspace updated', 'success');
    } catch (err) {
      showToast('Failed to set default workspace', 'error');
    }
  };

  // Duplicates
  const handleCloseDuplicates = async (
    groups: DuplicateGroup[],
    rule: any,
    allowClosingPinned: boolean
  ) => {
    try {
      const res = await duplicateService.closeDuplicates(groups, rule, allowClosingPinned);
      showToast(`Closed ${res.closedCount} duplicate tabs`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to close duplicate tabs', 'error');
    }
  };

  // AI
  const handleGenerateSuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await aiService.suggestCategories(openTabs);
      setSuggestions(res);
      showToast(`Generated ${res.length} category recommendations`, 'info');
    } catch (err) {
      showToast('Failed to generate suggestions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestion = async (s: AISuggestion) => {
    try {
      await aiService.applySuggestionAsGroup(s);
      showToast(`Group "${s.suggestedGroupName}" created in Chrome`, 'success');
    } catch (err) {
      showToast('Failed to create tab group', 'error');
    }
  };

  const handleApplyAllSuggestions = async (allSuggs: AISuggestion[]) => {
    try {
      for (const s of allSuggs) {
        await aiService.applySuggestionAsGroup(s);
      }
      showToast(`Applied ${allSuggs.length} tab groups`, 'success');
    } catch (err) {
      showToast('Failed to apply all groups', 'error');
    }
  };

  const handleSummarizeTab = async () => {
    if (openTabs.length === 0) return;
    const activeTab = openTabs.find((t) => t.active) || openTabs[0];
    setSummaryLoading(true);
    try {
      const res = await aiService.summarizeCurrentTab(activeTab.id);
      setSummary(res);
      showToast('Summary generated', 'success');
    } catch (err) {
      showToast('Failed to summarize page', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Saved Tabs
  const handleSaveNewTab = async (data: {
    title: string;
    url: string;
    tags: string[];
    workspaceId: string | null;
  }) => {
    try {
      const newRecord: TabRecord = {
        id: crypto.randomUUID(),
        url: data.url,
        title: data.title,
        domain: new URL(data.url).hostname,
        savedAt: new Date().toISOString(),
        workspaceId: data.workspaceId,
        groupId: null,
        tags: data.tags,
        notes: null,
        faviconUrl: null,
        version: 1,
        deletedAt: null,
      };
      await indexedDbAdapter.put('saved_tabs', newRecord);
      setSavedTabs((prev) => [newRecord, ...prev]);
      showToast('Tab saved to collection', 'success');
    } catch (err) {
      showToast('Failed to save tab record', 'error');
    }
  };

  const handleDeleteSavedTab = async (id: string) => {
    try {
      await indexedDbAdapter.delete('saved_tabs', id, true);
      setSavedTabs((prev) => prev.filter((t) => t.id !== id));
      showToast('Saved tab deleted', 'info');
    } catch (err) {
      showToast('Failed to delete saved tab', 'error');
    }
  };

  // Settings & Sync
  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updated = await settingsService.updatePreferences(updates);
      setPreferences(updated);
      showToast('Preferences saved', 'success');
    } catch (err) {
      showToast('Failed to update preferences', 'error');
    }
  };

  const handleToggleTheme = (theme: ThemeOption) => {
    handleUpdatePreferences({ theme });
  };

  const handleTriggerSync = async () => {
    try {
      showToast('Starting cloud sync...', 'info');
      const info = await syncService.runSync();
      setSyncStatus(info.status);
      setLastSyncedAt(info.lastSyncedAt);
      if (info.status === 'synced') {
        showToast('Sync completed successfully', 'success');
        loadData();
      } else if (info.status === 'error') {
        showToast(`Sync error: ${info.lastError}`, 'error');
      }
    } catch (err) {
      showToast('Cloud sync failed', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await storageService.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TabPilot_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup export downloaded', 'success');
    } catch (err) {
      showToast('Failed to export data', 'error');
    }
  };

  const handleImportData = async (fileContent: string, overwrite: boolean) => {
    const summary = await storageService.importData(fileContent, { overwriteConflicts: overwrite });
    showToast(
      `Imported ${summary.sessionsImported} sessions, ${summary.workspacesImported} workspaces`,
      'success'
    );
    loadData();
  };

  const handleClearAllData = async () => {
    try {
      await storageService.clearAllLocalData();
      showToast('All local data wiped', 'info');
      loadData();
    } catch (err) {
      showToast('Failed to clear database', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <LoadingState rows={5} message="Loading TabPilot..." />
      </div>
    );
  }

  return (
    <AppShell
      currentView={currentView}
      onNavigate={(v) => {
        setCurrentView(v);
        setSearchQuery('');
      }}
      openTabCount={openTabs.length}
      sessionCount={sessions.length}
      duplicateCount={duplicateCount}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      onWorkspaceSelect={(id) => setActiveWorkspaceId(id)}
      onNewWorkspace={() => setCurrentView('workspaces')}
      searchQuery={searchQuery}
      onSearchChange={(q) => setSearchQuery(q)}
      searchType={searchType}
      onSearchTypeChange={(t) => setSearchType(t)}
      syncStatus={syncStatus}
      lastSyncedAt={lastSyncedAt}
      onSyncClick={handleTriggerSync}
      onQuickSaveSession={handleSaveCurrentWindow}
      currentTheme={preferences.theme}
      onToggleTheme={handleToggleTheme}
    >
      {searchQuery.trim().length > 0 ? (
        <SearchResults
          query={searchQuery}
          results={searchResults}
          onActivateTab={handleActivateTab}
          onOpenUrl={(url) => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
              chrome.tabs.create({ url });
            } else {
              window.open(url, '_blank');
            }
          }}
          onRestoreSession={handleRestoreSession}
          onSelectWorkspace={(wsId) => {
            setActiveWorkspaceId(wsId);
            setCurrentView('workspaces');
            setSearchQuery('');
          }}
        />
      ) : (
        <>
          {!isExtensionActive && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-amber-200">
                    Standalone Web Preview Mode
                  </h4>
                  <p className="text-xs text-amber-300/80 mt-0.5 max-w-2xl leading-relaxed">
                    Browser security prevents hosted web pages (<code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200 font-mono">vercel.app</code>) from scraping or viewing your open browser tabs and windows.
                    To scrape and manage your real Chrome tabs, install the TabPilot extension in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200 font-mono">chrome://extensions</code>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={handleToggleDemoMode}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-colors"
                >
                  {isDemoMode ? 'Exit Demo Mode' : 'Explore Demo Tabs'}
                </button>
                <button
                  onClick={() => setShowInstallModal(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Extension Setup Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {isDemoMode && (
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-lg px-3.5 py-2 mb-6 flex items-center justify-between text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Showing 6 sample demo tabs across 2 windows for interface evaluation.</span>
              </div>
              <button
                onClick={handleToggleDemoMode}
                className="underline hover:text-white transition-colors"
              >
                Clear Demo Tabs
              </button>
            </div>
          )}

          {currentView === 'overview' && (
            <OverviewPage
              openTabs={openTabs}
              sessions={sessions}
              workspaces={workspaces}
              duplicateCount={duplicateCount}
              suggestions={suggestions}
              onNavigate={(v) => setCurrentView(v)}
              onActivateTab={handleActivateTab}
              onCloseTab={handleCloseTab}
              onRestoreSession={handleRestoreSession}
              onQuickSaveSession={handleSaveCurrentWindow}
            />
          )}

          {currentView === 'tabs' && (
            <TabList
              tabs={openTabs}
              onActivate={handleActivateTab}
              onCloseTab={handleCloseTab}
              onCloseTabs={handleCloseTabs}
              onTogglePin={handleTogglePin}
              onSaveSession={handleSaveSelectedTabsAsSession}
              onGroupTabs={async (tabIds) => {
                await tabService.groupTabs(tabIds);
                showToast(`Grouped ${tabIds.length} tabs`, 'success');
              }}
              onRefresh={loadData}
              isExtensionActive={isExtensionActive}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}

          {currentView === 'sessions' && (
            <SessionList
              sessions={sessions}
              onRestoreSession={handleRestoreSession}
              onRestoreTabs={handleRestoreTabs}
              onSaveCurrentWindow={handleSaveCurrentWindow}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              onDuplicateSession={handleDuplicateSession}
            />
          )}

          {currentView === 'workspaces' && (
            <WorkspaceList
              workspaces={workspaces}
              onSaveWorkspace={handleSaveWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onSetDefault={handleSetDefaultWorkspace}
            />
          )}

          {currentView === 'saved' && (
            <SavedTabsPage
              savedTabs={savedTabs}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onOpenTab={(url) => {
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                  chrome.tabs.create({ url });
                } else {
                  window.open(url, '_blank');
                }
              }}
              onSaveNewTab={handleSaveNewTab}
              onDeleteSavedTab={handleDeleteSavedTab}
            />
          )}

          {currentView === 'duplicates' && (
            <DuplicateReview
              exactGroups={exactGroups}
              likelyGroups={likelyGroups}
              totalDuplicatesCount={duplicateCount}
              onCloseDuplicates={handleCloseDuplicates}
              onRefresh={loadData}
            />
          )}

          {currentView === 'recently_closed' && (
            <RecentlyClosedPage
              items={recentlyClosed}
              onRestore={async (sessId) => {
                await tabService.restoreRecentlyClosed(sessId);
                showToast('Restored tab/window', 'success');
                loadData();
              }}
              onRefresh={loadData}
            />
          )}

          {currentView === 'ai' && (
            <div className="space-y-8">
              <AIOrganizationPanel
                suggestions={suggestions}
                allTabs={openTabs}
                isLoading={aiLoading}
                isAIConfigured={aiService.isConfigured()}
                onGenerateSuggestions={handleGenerateSuggestions}
                onApplySuggestion={handleApplySuggestion}
                onApplyAllSuggestions={handleApplyAllSuggestions}
              />

              <PageSummary
                summary={summary}
                isLoading={summaryLoading}
                onRefresh={handleSummarizeTab}
              />
            </div>
          )}

          {currentView === 'settings' && (
            <SettingsPage
              preferences={preferences}
              storageUsage={storageUsage}
              syncStatus={syncStatus}
              lastSyncedAt={lastSyncedAt}
              onUpdatePreferences={handleUpdatePreferences}
              onTriggerSync={handleTriggerSync}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onClearAllData={handleClearAllData}
            />
          )}
        </>
      )}

      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Scrape Real Browser Tabs with Extension</span>
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard web browsers prevent websites from scraping or reading your tabs for privacy and security. TabPilot is packaged as a high-performance Manifest V3 extension to manage all your active browser windows and tabs:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Download or Build Extension</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Download the prebuilt extension zip from GitHub releases or run <code className="font-mono text-blue-500">npm run package:extension</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Open Extensions in Chrome</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Navigate to <code className="font-mono text-blue-500">chrome://extensions</code> in your Chrome address bar and enable <strong>Developer mode</strong> in the top-right.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Load Unpacked</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Click <strong>Load unpacked</strong> and select the unzipped folder (or the project <code className="font-mono text-blue-500">dist/</code> folder). TabPilot will immediately scrape all your open windows and tabs!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowInstallModal(false);
                  handleToggleDemoMode();
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                Explore Demo Tabs Instead
              </button>
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
