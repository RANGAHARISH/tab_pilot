import { logger } from '../lib/logger';

export class TabEventHandler {
  private updateBadgeTimeout: NodeJS.Timeout | null = null;

  init() {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return;
    }

    chrome.tabs.onCreated.addListener((tab) => {
      this.scheduleBadgeUpdate();
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      this.scheduleBadgeUpdate();
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.scheduleBadgeUpdate();
      }
    });

    // Update count immediately on worker startup
    this.scheduleBadgeUpdate();
    logger.info('Tab event handlers registered');
  }

  private scheduleBadgeUpdate() {
    if (this.updateBadgeTimeout) {
      clearTimeout(this.updateBadgeTimeout);
    }

    this.updateBadgeTimeout = setTimeout(async () => {
      await this.updateTabCountBadge();
    }, 300);
  }

  async updateTabCountBadge() {
    if (typeof chrome === 'undefined' || !chrome.action || !chrome.tabs) return;

    try {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError || !tabs) return;
        const count = tabs.length;
        const text = count > 0 ? (count > 99 ? '99+' : String(count)) : '';

        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
      });
    } catch (err) {
      logger.warn('Failed to update action badge:', err);
    }
  }
}

export const tabEventHandler = new TabEventHandler();
