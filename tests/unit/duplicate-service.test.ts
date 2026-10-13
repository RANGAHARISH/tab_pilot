import { describe, it, expect, vi } from 'vitest';
import { DuplicateService } from '../../src/services/duplicate-service';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { BrowserTab } from '../../src/domain/types';

describe('DuplicateService', () => {
  const mockTabs: BrowserTab[] = [
    {
      id: 1,
      windowId: 1,
      url: 'https://example.com/page?id=42&utm_source=twitter',
      title: 'Example Page - First',
      active: true,
      pinned: false,
      incognito: false,
      index: 0,
    },
    {
      id: 2,
      windowId: 1,
      url: 'https://example.com/page?id=42&utm_source=slack',
      title: 'Example Page - Duplicate',
      active: false,
      pinned: false,
      incognito: false,
      index: 1,
    },
    {
      id: 3,
      windowId: 2,
      url: 'https://github.com/google/tabpilot',
      title: 'GitHub TabPilot',
      active: false,
      pinned: true,
      incognito: false,
      index: 0,
    },
    {
      id: 4,
      windowId: 2,
      url: 'https://github.com/google/tabpilot#readme',
      title: 'GitHub TabPilot Readme',
      active: false,
      pinned: false,
      incognito: false,
      index: 1,
    },
  ];

  const mockTabsAdapter: ITabsAdapter = {
    queryTabs: vi.fn(async () => mockTabs),
    getTab: vi.fn(),
    createTab: vi.fn(),
    updateTab: vi.fn(),
    closeTabs: vi.fn(async () => {}),
    moveTabs: vi.fn(),
    pinTab: vi.fn(),
    createGroup: vi.fn(),
    ungroupTabs: vi.fn(),
    createWindow: vi.fn(),
    getAllWindows: vi.fn(),
    getRecentlyClosed: vi.fn(),
    restoreRecentlyClosed: vi.fn(),
    extractPageContent: vi.fn(),
  };

  it('detects exact normalized duplicate tabs across different tracking params and anchors', async () => {
    const service = new DuplicateService(mockTabsAdapter);
    const result = await service.findDuplicates(mockTabs);

    expect(result.totalDuplicatesCount).toBe(2);
    expect(result.exactGroups).toHaveLength(2);

    // Check first group: https://example.com/page?id=42
    const group1 = result.exactGroups.find((g) => g.normalizedUrl.includes('example.com'));
    expect(group1).toBeDefined();
    expect(group1?.tabs).toHaveLength(2);
    expect(group1?.primaryTabId).toBe(1); // active tab is kept

    // Check second group: https://github.com/google/tabpilot
    const group2 = result.exactGroups.find((g) => g.normalizedUrl.includes('github.com'));
    expect(group2).toBeDefined();
    expect(group2?.tabs).toHaveLength(2);
    expect(group2?.primaryTabId).toBe(3); // pinned tab is kept
  });

  it('selects primary tab according to retention rule', () => {
    const service = new DuplicateService(mockTabsAdapter);
    const tabs: BrowserTab[] = [
      { id: 10, windowId: 1, url: 'https://test.com', title: 'Oldest', active: false, pinned: false, incognito: false, index: 0 },
      { id: 20, windowId: 1, url: 'https://test.com', title: 'Active', active: true, pinned: false, incognito: false, index: 1 },
      { id: 30, windowId: 1, url: 'https://test.com', title: 'Newest', active: false, pinned: false, incognito: false, index: 2 },
    ];

    expect(service.selectPrimaryTab(tabs, 'keep-active').id).toBe(20);
    expect(service.selectPrimaryTab(tabs, 'keep-oldest').id).toBe(10);
    expect(service.selectPrimaryTab(tabs, 'keep-newest').id).toBe(30);
  });

  it('closes only duplicate tabs and protects pinned tabs', async () => {
    const service = new DuplicateService(mockTabsAdapter);
    const result = await service.findDuplicates(mockTabs);

    const closeRes = await service.closeDuplicates(result.exactGroups, 'keep-active', false);
    expect(mockTabsAdapter.closeTabs).toHaveBeenCalledWith([2, 4]);
    expect(closeRes.closedCount).toBe(2);
  });
});
