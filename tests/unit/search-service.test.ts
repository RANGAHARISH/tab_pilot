import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../../src/services/search-service';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { BrowserTab, Session, Workspace } from '../../src/domain/types';

describe('SearchService', () => {
  let db: IndexedDbAdapter;
  let mockTabsAdapter: ITabsAdapter;
  let service: SearchService;

  const mockOpenTabs: BrowserTab[] = [
    {
      id: 1,
      windowId: 1,
      url: 'https://vitejs.dev/guide',
      title: 'Vite Next Generation Frontend Tooling',
      active: true,
      pinned: false,
      incognito: false,
      index: 0,
    },
    {
      id: 2,
      windowId: 1,
      url: 'https://github.com/facebook/react',
      title: 'React GitHub Repository',
      active: false,
      pinned: false,
      incognito: false,
      index: 1,
    },
  ];

  beforeEach(async () => {
    const dbName = `TestSearchDB_${Math.random().toString(36).substring(2)}`;
    db = new IndexedDbAdapter(dbName, 1);
    await db.init();

    mockTabsAdapter = {
      queryTabs: vi.fn(async () => mockOpenTabs),
      getTab: vi.fn(),
      createTab: vi.fn(),
      updateTab: vi.fn(),
      closeTabs: vi.fn(),
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

    service = new SearchService(db, mockTabsAdapter);
  });

  it('searches across open tabs matching title and url tokens', async () => {
    const results = await service.search('vite tooling');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('open_tab');
    expect(results[0].title).toContain('Vite');
  });

  it('searches across saved sessions', async () => {
    const session: Session = {
      id: 'sess_99',
      name: 'Design System Sprint',
      workspaceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tabs: [],
      tabCount: 0,
      restoreOptions: { openInNewWindow: false, avoidDuplicates: true },
      version: 1,
      deletedAt: null,
    };
    await db.put('sessions', session);

    const results = await service.search('sprint');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('session');
    expect(results[0].title).toBe('Design System Sprint');
  });

  it('filters results by content type', async () => {
    const results = await service.search('react', { contentType: 'session' });
    expect(results).toHaveLength(0); // open tab was ignored because filter was session
  });
});
