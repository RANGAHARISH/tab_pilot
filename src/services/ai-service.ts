import type { AISuggestion, BrowserTab, PageSummaryResult } from '../domain/types';
import { IAIProviderAdapter, aiProviderAdapter } from '../adapters/ai-provider-adapter';
import { ITabsAdapter, tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { logger } from '../lib/logger';

export class AIService {
  constructor(
    private ai: IAIProviderAdapter = aiProviderAdapter,
    private tabs: ITabsAdapter = tabsAdapter,
    private idb: IIndexedDbAdapter = indexedDbAdapter
  ) {}

  isConfigured(): boolean {
    return this.ai.isConfigured();
  }

  async suggestCategories(tabsToAnalyze?: BrowserTab[]): Promise<AISuggestion[]> {
    const list = tabsToAnalyze || (await this.tabs.queryTabs());
    const valid = list.filter((t) => t.url && !t.url.startsWith('chrome-extension://'));
    return this.ai.categorizeTabs(valid);
  }

  async summarizeCurrentTab(tabId: number): Promise<PageSummaryResult> {
    const tab = await this.tabs.getTab(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} could not be found`);
    }

    const content = await this.tabs.extractPageContent(tabId);
    return this.ai.summarizePage(tab, content || '');
  }

  async applySuggestionAsGroup(suggestion: AISuggestion): Promise<number | null> {
    if (suggestion.tabIds.length === 0) return null;
    return this.tabs.createGroup({
      tabIds: suggestion.tabIds,
      title: suggestion.suggestedGroupName,
    });
  }
}

export const aiService = new AIService();
