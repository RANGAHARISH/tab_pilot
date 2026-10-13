import type { BrowserTab, DuplicateGroup } from '../domain/types';
import { ITabsAdapter, tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { normalizeUrl, extractDomain, isLikelyDuplicate } from '../lib/url-utils';
import { logger } from '../lib/logger';

export type DuplicateRetentionRule = 'keep-active' | 'keep-oldest' | 'keep-newest';

export interface DuplicateDetectionResult {
  exactGroups: DuplicateGroup[];
  likelyGroups: DuplicateGroup[];
  totalDuplicatesCount: number;
}

export class DuplicateService {
  constructor(private tabs: ITabsAdapter = tabsAdapter) {}

  /**
   * Finds duplicate tabs among currently open browser tabs.
   */
  async findDuplicates(tabsToAnalyze?: BrowserTab[]): Promise<DuplicateDetectionResult> {
    const allTabs = tabsToAnalyze || (await this.tabs.queryTabs());
    const validTabs = allTabs.filter(
      (t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://newtab')
    );

    const exactMap = new Map<string, BrowserTab[]>();

    for (const tab of validTabs) {
      const norm = normalizeUrl(tab.url);
      if (!norm) continue;

      const group = exactMap.get(norm) || [];
      group.push(tab);
      exactMap.set(norm, group);
    }

    const exactGroups: DuplicateGroup[] = [];
    const groupedTabIds = new Set<number>();

    for (const [normUrl, tabs] of exactMap.entries()) {
      if (tabs.length > 1) {
        tabs.forEach((t) => groupedTabIds.add(t.id));
        const domain = extractDomain(normUrl);
        const primaryTab = this.selectPrimaryTab(tabs, 'keep-active');
        exactGroups.push({
          normalizedUrl: normUrl,
          domain,
          isExact: true,
          tabs,
          primaryTabId: primaryTab.id,
        });
      }
    }

    // Likely duplicates (same path, differing harmless query params)
    const remainingTabs = validTabs.filter((t) => !groupedTabIds.has(t.id));
    const likelyGroups: DuplicateGroup[] = [];

    for (let i = 0; i < remainingTabs.length; i++) {
      const current = remainingTabs[i];
      if (groupedTabIds.has(current.id)) continue;

      const cluster = [current];
      for (let j = i + 1; j < remainingTabs.length; j++) {
        const candidate = remainingTabs[j];
        if (groupedTabIds.has(candidate.id)) continue;

        if (isLikelyDuplicate(current.url, candidate.url)) {
          cluster.push(candidate);
          groupedTabIds.add(candidate.id);
        }
      }

      if (cluster.length > 1) {
        groupedTabIds.add(current.id);
        const domain = extractDomain(current.url);
        const primaryTab = this.selectPrimaryTab(cluster, 'keep-active');
        likelyGroups.push({
          normalizedUrl: normalizeUrl(current.url),
          domain,
          isExact: false,
          tabs: cluster,
          primaryTabId: primaryTab.id,
        });
      }
    }

    const totalDuplicatesCount =
      exactGroups.reduce((acc, g) => acc + (g.tabs.length - 1), 0) +
      likelyGroups.reduce((acc, g) => acc + (g.tabs.length - 1), 0);

    return { exactGroups, likelyGroups, totalDuplicatesCount };
  }

  /**
   * Transparently selects which tab to retain according to the chosen rule.
   */
  selectPrimaryTab(tabs: BrowserTab[], rule: DuplicateRetentionRule): BrowserTab {
    if (tabs.length === 0) throw new Error('Tabs array cannot be empty');

    switch (rule) {
      case 'keep-active': {
        const activeTab = tabs.find((t) => t.active);
        if (activeTab) return activeTab;
        const pinnedTab = tabs.find((t) => t.pinned);
        if (pinnedTab) return pinnedTab;
        return tabs[0];
      }
      case 'keep-oldest':
        return [...tabs].sort((a, b) => a.id - b.id)[0];
      case 'keep-newest':
        return [...tabs].sort((a, b) => b.id - a.id)[0];
    }
  }

  /**
   * Closes duplicate tabs from the specified groups, keeping the primary tab.
   * Never closes pinned tabs unless explicitly permitted.
   */
  async closeDuplicates(
    groups: DuplicateGroup[],
    rule: DuplicateRetentionRule = 'keep-active',
    allowClosingPinned = false
  ): Promise<{ closedCount: number; closedTabIds: number[] }> {
    const tabsToClose: number[] = [];

    for (const group of groups) {
      const primary = this.selectPrimaryTab(group.tabs, rule);
      for (const tab of group.tabs) {
        if (tab.id !== primary.id) {
          if (!tab.pinned || allowClosingPinned) {
            tabsToClose.push(tab.id);
          }
        }
      }
    }

    if (tabsToClose.length > 0) {
      await this.tabs.closeTabs(tabsToClose);
      logger.info(`Closed ${tabsToClose.length} duplicate tabs`);
    }

    return {
      closedCount: tabsToClose.length,
      closedTabIds: tabsToClose,
    };
  }
}

export const duplicateService = new DuplicateService();
