import type { BrowserTab } from '../domain/types';
import { TabOperationError, PermissionError } from '../domain/errors';
import { logger } from '../lib/logger';

export interface ITabsAdapter {
  queryTabs(queryInfo?: chrome.tabs.QueryInfo): Promise<BrowserTab[]>;
  getTab(tabId: number): Promise<BrowserTab | null>;
  createTab(createProperties: chrome.tabs.CreateProperties): Promise<BrowserTab>;
  updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<BrowserTab | null>;
  closeTabs(tabIds: number[]): Promise<void>;
  moveTabs(tabIds: number[], index: number, windowId?: number): Promise<void>;
  pinTab(tabId: number, pinned: boolean): Promise<void>;
  createGroup(options: { tabIds: number[]; title?: string; color?: chrome.tabGroups.ColorEnum }): Promise<number | null>;
  ungroupTabs?(tabIds: number[]): Promise<void>;
  createWindow(urls: string[]): Promise<chrome.windows.Window | null>;
  getAllWindows?(): Promise<chrome.windows.Window[]>;
  getRecentlyClosed(maxResults?: number): Promise<chrome.sessions.Session[]>;
  restoreRecentlyClosed(sessionId: string): Promise<chrome.sessions.Session | null>;
  extractPageContent(tabId: number): Promise<string | null>;
  isAvailable?(): boolean;
  setDemoMode?(enabled: boolean): void;
  getDemoMode?(): boolean;
}

export class ChromeTabsAdapter implements ITabsAdapter {
  private previewTabs: BrowserTab[] = [
    {
      id: 1,
      windowId: 1,
      url: 'https://github.com/google/tabpilot',
      title: 'Google TabPilot - Production Tab Organizer',
      favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
      active: true,
      pinned: true,
      index: 0,
    },
    {
      id: 2,
      windowId: 1,
      url: 'https://github.com/google/tabpilot?utm_source=twitter',
      title: 'Google TabPilot - Production Tab Organizer (Duplicate)',
      favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
      active: false,
      pinned: false,
      index: 1,
    },
    {
      id: 3,
      windowId: 1,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
      title: 'IndexedDB API - Web APIs | MDN',
      favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png',
      active: false,
      pinned: false,
      index: 2,
    },
    {
      id: 4,
      windowId: 1,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#methods',
      title: 'IndexedDB API - Methods | MDN (Duplicate)',
      favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png',
      active: false,
      pinned: false,
      index: 3,
    },
    {
      id: 5,
      windowId: 1,
      url: 'https://vitejs.dev/guide/',
      title: 'Getting Started | Vite Next Gen Frontend',
      favIconUrl: 'https://vitejs.dev/logo.svg',
      active: false,
      pinned: false,
      index: 4,
    },
    {
      id: 6,
      windowId: 2,
      url: 'https://news.ycombinator.com/',
      title: 'Hacker News',
      favIconUrl: 'https://news.ycombinator.com/favicon.ico',
      active: false,
      pinned: false,
      index: 0,
    },
  ];

  private isDemoMode: boolean = false;
  private bridgeReady: boolean = false;

  constructor() {
    this.initBridgeListener();
  }

  private initBridgeListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data?.source === 'TABPILOT_EXTENSION_BRIDGE' && event.data?.event === 'READY') {
          this.bridgeReady = true;
          logger.info('TabPilot extension bridge connected to web page');
        }
      });
    }
  }

  public isAvailable(): boolean {
    return (
      (typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined') ||
      this.bridgeReady
    );
  }

  public setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
  }

  public getDemoMode(): boolean {
    return this.isDemoMode;
  }

  public mapTab(tab: chrome.tabs.Tab): BrowserTab {
    const rawUrl = tab.url || (tab as { pendingUrl?: string }).pendingUrl || '';
    return {
      id: tab.id || 0,
      windowId: tab.windowId || 0,
      url: rawUrl,
      title: tab.title || (rawUrl ? rawUrl.replace(/^https?:\/\//, '') : 'Untitled'),
      favIconUrl: tab.favIconUrl || null,
      active: !!tab.active,
      pinned: !!tab.pinned,
      highlighted: !!tab.highlighted,
      incognito: !!tab.incognito,
      groupId: typeof tab.groupId === 'number' && tab.groupId > 0 ? tab.groupId : null,
      discarded: !!tab.discarded,
      status: tab.status === 'loading' ? 'loading' : 'complete',
    };
  }

  async queryTabs(queryInfo: chrome.tabs.QueryInfo = {}): Promise<BrowserTab[]> {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve, reject) => {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime.lastError) {
            return reject(new TabOperationError(chrome.runtime.lastError.message || 'Failed to query tabs'));
          }
          resolve((tabs || []).map((t) => this.mapTab(t)));
        });
      });
    }

    if (this.bridgeReady && typeof window !== 'undefined') {
      try {
        return await this.sendBridgeRequest<BrowserTab[]>('QUERY_TABS', queryInfo);
      } catch (err) {
        logger.warn('Bridge tab query failed:', err);
      }
    }

    // Only return sample tabs if user explicitly turned on demo mode
    if (this.isDemoMode) {
      return [...this.previewTabs];
    }

    // Default: return empty list so we NEVER show random fake tabs as real tabs
    return [];
  }

  async getAllWindows(): Promise<chrome.windows.Window[]> {
    if (typeof chrome !== 'undefined' && chrome.windows) {
      return new Promise((resolve) => {
        chrome.windows.getAll({ populate: true }, (windows) => {
          if (chrome.runtime.lastError || !windows) {
            logger.warn('Failed to scrape all windows:', chrome.runtime.lastError?.message);
            resolve([]);
          } else {
            resolve(windows);
          }
        });
      });
    }

    if (this.isDemoMode) {
      return [
        {
          id: 1,
          focused: true,
          incognito: false,
          state: 'normal',
          type: 'normal',
          alwaysOnTop: false,
          tabs: this.previewTabs.filter((t) => t.windowId === 1) as unknown as chrome.tabs.Tab[],
        },
        {
          id: 2,
          focused: false,
          incognito: false,
          state: 'normal',
          type: 'normal',
          alwaysOnTop: false,
          tabs: this.previewTabs.filter((t) => t.windowId === 2) as unknown as chrome.tabs.Tab[],
        },
      ];
    }

    return [];
  }

  private sendBridgeRequest<T>(action: string, payload?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random()}`;
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new TabOperationError('Bridge request timed out'));
      }, 5000);

      const handler = (event: MessageEvent) => {
        if (
          event.data?.source === 'TABPILOT_EXTENSION_BRIDGE' &&
          event.data?.requestId === requestId
        ) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          if (event.data.error) {
            reject(new TabOperationError(event.data.error));
          } else {
            resolve(event.data.response?.data || event.data.response || []);
          }
        }
      };

      window.addEventListener('message', handler);
      window.postMessage(
        {
          source: 'TABPILOT_WEB_PAGE',
          action,
          payload,
          requestId,
        },
        '*'
      );
    });
  }

  async getTab(tabId: number): Promise<BrowserTab | null> {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            resolve(null);
          } else {
            resolve(this.mapTab(tab));
          }
        });
      });
    }

    if (this.isDemoMode) {
      return this.previewTabs.find((t) => t.id === tabId) || null;
    }

    return null;
  }

  async createTab(createProperties: chrome.tabs.CreateProperties): Promise<BrowserTab> {
    if (!this.isAvailable()) {
      const newTab: BrowserTab = {
        id: Date.now(),
        windowId: 1,
        url: createProperties.url || '',
        title: createProperties.url || 'New Tab',
        favIconUrl: null,
        active: !!createProperties.active,
        pinned: !!createProperties.pinned,
        index: this.previewTabs.length,
      };
      this.previewTabs.push(newTab);
      return newTab;
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.create(createProperties, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          return reject(new TabOperationError(chrome.runtime.lastError?.message || 'Failed to create tab'));
        }
        resolve(this.mapTab(tab));
      });
    });
  }

  async updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<BrowserTab | null> {
    if (!this.isAvailable()) {
      const tab = this.previewTabs.find((t) => t.id === tabId);
      if (tab) {
        if (updateProperties.pinned !== undefined) tab.pinned = updateProperties.pinned;
        if (updateProperties.active !== undefined) {
          this.previewTabs.forEach((t) => {
            if (t.windowId === tab.windowId) t.active = false;
          });
          tab.active = updateProperties.active;
        }
        return { ...tab };
      }
      return null;
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, updateProperties, (tab) => {
        if (chrome.runtime.lastError) {
          return reject(new TabOperationError(chrome.runtime.lastError.message || `Failed to update tab ${tabId}`));
        }
        resolve(tab ? this.mapTab(tab) : null);
      });
    });
  }

  async closeTabs(tabIds: number[]): Promise<void> {
    if (tabIds.length === 0) return;
    if (!this.isAvailable()) {
      const idSet = new Set(tabIds);
      this.previewTabs = this.previewTabs.filter((t) => !idSet.has(t.id));
      return;
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabIds, () => {
        if (chrome.runtime.lastError) {
          logger.warn('Error closing tabs:', chrome.runtime.lastError.message);
          return reject(new TabOperationError(chrome.runtime.lastError.message || 'Failed to remove tabs'));
        }
        resolve();
      });
    });
  }

  async moveTabs(tabIds: number[], index: number, windowId?: number): Promise<void> {
    if (!this.isAvailable() || tabIds.length === 0) return;

    return new Promise((resolve, reject) => {
      const moveProps: chrome.tabs.MoveProperties = { index };
      if (typeof windowId === 'number') {
        moveProps.windowId = windowId;
      }
      chrome.tabs.move(tabIds, moveProps, () => {
        if (chrome.runtime.lastError) {
          return reject(new TabOperationError(chrome.runtime.lastError.message || 'Failed to move tabs'));
        }
        resolve();
      });
    });
  }

  async pinTab(tabId: number, pinned: boolean): Promise<void> {
    await this.updateTab(tabId, { pinned });
  }

  async createGroup(options: {
    tabIds: number[];
    title?: string;
    color?: chrome.tabGroups.ColorEnum;
  }): Promise<number | null> {
    if (!this.isAvailable() || typeof chrome.tabs.group !== 'function') {
      logger.info('Tab grouping is not supported in this browser version/environment');
      return null;
    }

    return new Promise((resolve) => {
      chrome.tabs.group({ tabIds: options.tabIds }, (groupId) => {
        if (chrome.runtime.lastError || typeof groupId !== 'number') {
          logger.warn('Failed to group tabs:', chrome.runtime.lastError?.message);
          return resolve(null);
        }

        if (chrome.tabGroups && (options.title || options.color)) {
          chrome.tabGroups.update(
            groupId,
            {
              title: options.title,
              color: options.color,
            },
            () => resolve(groupId)
          );
        } else {
          resolve(groupId);
        }
      });
    });
  }

  async ungroupTabs(tabIds: number[]): Promise<void> {
    if (!this.isAvailable() || typeof chrome.tabs.ungroup !== 'function') {
      return;
    }

    return new Promise((resolve) => {
      chrome.tabs.ungroup(tabIds, () => resolve());
    });
  }

  async createWindow(urls: string[]): Promise<chrome.windows.Window | null> {
    if (typeof chrome === 'undefined' || !chrome.windows) {
      return null;
    }

    return new Promise((resolve, reject) => {
      chrome.windows.create({ url: urls }, (win) => {
        if (chrome.runtime.lastError || !win) {
          return reject(new TabOperationError(chrome.runtime.lastError?.message || 'Failed to create window'));
        }
        resolve(win);
      });
    });
  }

  async getRecentlyClosed(maxResults = 25): Promise<chrome.sessions.Session[]> {
    if (typeof chrome === 'undefined' || !chrome.sessions) {
      logger.info('chrome.sessions API not available');
      return [];
    }

    return new Promise((resolve) => {
      chrome.sessions.getRecentlyClosed({ maxResults }, (sessions) => {
        if (chrome.runtime.lastError) {
          logger.warn('Failed to fetch recently closed:', chrome.runtime.lastError.message);
          resolve([]);
        } else {
          resolve(sessions || []);
        }
      });
    });
  }

  async restoreRecentlyClosed(sessionId: string): Promise<chrome.sessions.Session | null> {
    if (typeof chrome === 'undefined' || !chrome.sessions) {
      throw new PermissionError('sessions', 'chrome.sessions not available');
    }

    return new Promise((resolve, reject) => {
      chrome.sessions.restore(sessionId, (restoredSession) => {
        if (chrome.runtime.lastError) {
          return reject(new TabOperationError(chrome.runtime.lastError.message || 'Failed to restore session'));
        }
        resolve(restoredSession || null);
      });
    });
  }

  async extractPageContent(tabId: number): Promise<string | null> {
    if (typeof chrome === 'undefined' || !chrome.scripting) {
      logger.warn('chrome.scripting not available for content extraction');
      return null;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Extract main text content, ignoring script and style tags
          const clone = document.body.cloneNode(true) as HTMLElement;
          const scripts = clone.querySelectorAll('script, style, noscript, nav, footer, header, svg');
          scripts.forEach((el) => el.remove());
          const text = clone.innerText || clone.textContent || '';
          return text.replace(/\s+/g, ' ').trim().slice(0, 10000); // capped at 10k chars
        },
      });

      if (results && results[0] && typeof results[0].result === 'string') {
        return results[0].result;
      }
      return null;
    } catch (err) {
      logger.warn(`Failed to extract page content from tab ${tabId}:`, err);
      return null;
    }
  }
}

export const tabsAdapter = new ChromeTabsAdapter();
