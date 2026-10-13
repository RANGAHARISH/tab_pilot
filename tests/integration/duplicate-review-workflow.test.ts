import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DuplicateService } from '../../src/services/duplicate-service';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { BrowserTab } from '../../src/domain/types';

describe('Integration: Duplicate Review Workflow', () => {
  let mockTabs: BrowserTab[];
  let closedTabIds: number[];
  let mockTabsAdapter: ITabsAdapter;
  let service: DuplicateService;

  beforeEach(() => {
    closedTabIds = [];
    mockTabs = [
      {
        id: 1,
        windowId: 1,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
        title: 'IndexedDB API - Web APIs | MDN',
        active: true,
        pinned: false,
        incognito: false,
        index: 0,
      },
      {
        id: 2,
        windowId: 1,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API?utm_source=docs',
        title: 'IndexedDB API - Web APIs | MDN',
        active: false,
        pinned: false,
        incognito: false,
        index: 1,
      },
      {
        id: 3,
        windowId: 2,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#methods',
        title: 'IndexedDB API - Web APIs | MDN',
        active: false,
        pinned: true, // Pinned tab
        incognito: false,
        index: 0,
      },
    ];

    mockTabsAdapter = {
      queryTabs: vi.fn(async () => mockTabs),
      getTab: vi.fn(),
      createTab: vi.fn(),
      updateTab: vi.fn(),
      closeTabs: vi.fn(async (ids: number[]) => {
        closedTabIds.push(...ids);
      }),
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

    service = new DuplicateService(mockTabsAdapter);
  });

  it('runs complete duplicate scan, groups by normalized canonical URL, and respects pinned protection', async () => {
    // 1. Scan
    const scan = await service.findDuplicates(mockTabs);
    expect(scan.totalDuplicatesCount).toBe(2);
    expect(scan.exactGroups).toHaveLength(1);

    const group = scan.exactGroups[0];
    expect(group.tabs).toHaveLength(3);

    // 2. Select retention rule 'keep-active' with pinned protection enabled
    const closeResult = await service.closeDuplicates(scan.exactGroups, 'keep-active', false);

    // Tab 1 is active (kept). Tab 3 is pinned (protected from close). Tab 2 is neither (closed).
    expect(closedTabIds).toContain(2);
    expect(closedTabIds).not.toContain(1);
    expect(closedTabIds).not.toContain(3);
    expect(closeResult.closedCount).toBe(1);
  });
});
