import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../../src/services/ai-service';
import { AIProviderAdapter } from '../../src/adapters/ai-provider-adapter';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { IIndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import type { BrowserTab } from '../../src/domain/types';

describe('AIService & AIProviderAdapter Fallback', () => {
  it('uses deterministic local rule-based clustering fallback when unconfigured', async () => {
    const adapter = new AIProviderAdapter();
    expect(adapter.isConfigured()).toBe(false);

    const testTabs: BrowserTab[] = [
      { id: 1, windowId: 1, url: 'https://github.com/pulls', title: 'GitHub Pull Requests', active: false, pinned: false, incognito: false, index: 0 },
      { id: 2, windowId: 1, url: 'https://github.com/issues', title: 'GitHub Issues', active: false, pinned: false, incognito: false, index: 1 },
      { id: 3, windowId: 1, url: 'https://twitter.com/home', title: 'X / Twitter Feed', active: false, pinned: false, incognito: false, index: 2 },
      { id: 4, windowId: 1, url: 'https://x.com/notifications', title: 'X Notifications', active: false, pinned: false, incognito: false, index: 3 },
    ];

    const suggestions = await adapter.categorizeTabs(testTabs);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);

    const devGroup = suggestions.find((s) => s.category.includes('Development') || s.suggestedGroupName.includes('Docs'));
    expect(devGroup).toBeDefined();
    expect(devGroup?.tabIds).toContain(1);
    expect(devGroup?.tabIds).toContain(2);
  });

  it('creates Chrome tab group when applying suggestion', async () => {
    const mockTabsAdapter: ITabsAdapter = {
      queryTabs: vi.fn(),
      getTab: vi.fn(),
      createTab: vi.fn(),
      updateTab: vi.fn(),
      closeTabs: vi.fn(),
      moveTabs: vi.fn(),
      pinTab: vi.fn(),
      createGroup: vi.fn(async () => 5),
      ungroupTabs: vi.fn(),
      createWindow: vi.fn(),
      getAllWindows: vi.fn(),
      getRecentlyClosed: vi.fn(),
      restoreRecentlyClosed: vi.fn(),
      extractPageContent: vi.fn(),
    };

    const mockDb: IIndexedDbAdapter = {
      init: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      put: vi.fn(),
      putBatch: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      close: vi.fn(),
    };

    const service = new AIService(new AIProviderAdapter(), mockTabsAdapter, mockDb);
    const groupId = await service.applySuggestionAsGroup({
      category: 'Research',
      suggestedGroupName: 'Science',
      reason: 'Physics tabs',
      confidence: 0.9,
      tabIds: [10, 11],
    });

    expect(groupId).toBe(5);
    expect(mockTabsAdapter.createGroup).toHaveBeenCalledWith({
      tabIds: [10, 11],
      title: 'Science',
    });
  });
});
