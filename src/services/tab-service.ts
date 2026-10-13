import type { BrowserTab, RecentlyClosedItem } from '../domain/types';
import { ITabsAdapter, tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { logger } from '../lib/logger';

export class TabService {
  constructor(private adapter: ITabsAdapter = tabsAdapter) {}

  async getOpenTabs(queryInfo: chrome.tabs.QueryInfo = {}): Promise<BrowserTab[]> {
    return this.adapter.queryTabs(queryInfo);
  }

  async closeTabs(tabIds: number[]): Promise<void> {
    if (tabIds.length === 0) return;
    await this.adapter.closeTabs(tabIds);
  }

  async activateTab(tabId: number, windowId?: number): Promise<void> {
    await this.adapter.updateTab(tabId, { active: true });
    if (typeof windowId === 'number' && typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.update(windowId, { focused: true }, () => {});
    }
  }

  async togglePin(tabId: number, currentPinned: boolean): Promise<void> {
    await this.adapter.pinTab(tabId, !currentPinned);
  }

  async moveTabs(tabIds: number[], index: number, windowId?: number): Promise<void> {
    await this.adapter.moveTabs(tabIds, index, windowId);
  }

  async groupTabs(
    tabIds: number[],
    groupName?: string,
    color?: chrome.tabGroups.ColorEnum
  ): Promise<number | null> {
    return this.adapter.createGroup({ tabIds, title: groupName, color });
  }

  async getRecentlyClosed(maxResults = 25): Promise<RecentlyClosedItem[]> {
    const rawSessions = await this.adapter.getRecentlyClosed(maxResults);
    const items: RecentlyClosedItem[] = [];

    for (const s of rawSessions) {
      if (s.tab) {
        items.push({
          id: `tab_${s.tab.sessionId || s.tab.id || Math.random()}`,
          type: 'tab',
          title: s.tab.title || 'Untitled tab',
          url: s.tab.url || '',
          closedAt: new Date(s.lastModified * 1000).toISOString(),
          sessionId: s.tab.sessionId,
        });
      } else if (s.window && s.window.tabs) {
        items.push({
          id: `win_${s.window.sessionId || s.window.id || Math.random()}`,
          type: 'window',
          title: `Window with ${s.window.tabs.length} tabs`,
          tabCount: s.window.tabs.length,
          closedAt: new Date(s.lastModified * 1000).toISOString(),
          sessionId: s.window.sessionId,
        });
      }
    }

    return items;
  }

  async restoreRecentlyClosed(sessionId: string): Promise<void> {
    await this.adapter.restoreRecentlyClosed(sessionId);
  }

  async getAllWindows(): Promise<chrome.windows.Window[]> {
    if (this.adapter.getAllWindows) {
      return this.adapter.getAllWindows();
    }
    return [];
  }

  setDemoMode(enabled: boolean): void {
    if (this.adapter.setDemoMode) {
      this.adapter.setDemoMode(enabled);
    }
  }

  getDemoMode(): boolean {
    if (this.adapter.getDemoMode) {
      return this.adapter.getDemoMode();
    }
    return false;
  }

  isExtensionAvailable(): boolean {
    if (this.adapter.isAvailable) {
      return this.adapter.isAvailable();
    }
    return false;
  }
}

export const tabService = new TabService();

