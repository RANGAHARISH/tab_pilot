import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../../src/services/session-service';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { BrowserTab } from '../../src/domain/types';

describe('SessionService', () => {
  let db: IndexedDbAdapter;
  let mockTabsAdapter: ITabsAdapter;
  let service: SessionService;

  const mockOpenTabs: BrowserTab[] = [
    {
      id: 101,
      windowId: 1,
      url: 'https://docs.github.com/en',
      title: 'GitHub Docs',
      active: true,
      pinned: false,
      incognito: false,
      index: 0,
    },
    {
      id: 102,
      windowId: 1,
      url: 'https://news.ycombinator.com',
      title: 'Hacker News',
      active: false,
      pinned: true,
      incognito: false,
      index: 1,
    },
  ];

  beforeEach(async () => {
    const dbName = `TestSessionDB_${Math.random().toString(36).substring(2)}`;
    db = new IndexedDbAdapter(dbName, 1);
    await db.init();

    mockTabsAdapter = {
      queryTabs: vi.fn(async () => mockOpenTabs),
      getTab: vi.fn(),
      createTab: vi.fn(async () => ({ id: 200, windowId: 1, url: '', title: '', active: false, pinned: false })),
      updateTab: vi.fn(),
      closeTabs: vi.fn(),
      moveTabs: vi.fn(),
      pinTab: vi.fn(),
      createGroup: vi.fn(),
      ungroupTabs: vi.fn(),
      createWindow: vi.fn(async () => ({ id: 50, tabs: [], focused: true, alwaysOnTop: false, incognito: false })),
      getAllWindows: vi.fn(),
      getRecentlyClosed: vi.fn(),
      restoreRecentlyClosed: vi.fn(),
      extractPageContent: vi.fn(),
    };

    service = new SessionService(db, mockTabsAdapter);
  });

  it('saves open tabs into a new session snapshot', async () => {
    const session = await service.saveSession({ name: 'Work Setup' });

    expect(session.name).toBe('Work Setup');
    expect(session.tabCount).toBe(2);
    expect(session.tabs).toHaveLength(2);
    expect(session.tabs[0].domain).toBe('docs.github.com');

    const all = await service.getAllSessions();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(session.id);
  });

  it('restores session tabs avoiding already open duplicates', async () => {
    const session = await service.saveSession({ name: 'Test Session' });

    // Open tabs now already has Hacker News
    mockTabsAdapter.queryTabs = vi.fn(async () => [
      {
        id: 102,
        windowId: 1,
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        active: false,
        pinned: false,
        incognito: false,
        index: 0,
      },
    ]);

    const result = await service.restoreSession(session.id, {
      openInNewWindow: false,
      avoidDuplicates: true,
    });

    expect(result.restoredCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(mockTabsAdapter.createTab).toHaveBeenCalledTimes(1);
  });

  it('renames an existing session', async () => {
    const session = await service.saveSession({ name: 'Old Name' });
    const updated = await service.renameSession(session.id, 'New Name');

    expect(updated.name).toBe('New Name');
    expect(updated.version).toBe(2);

    const reloaded = await service.getSessionById(session.id);
    expect(reloaded?.name).toBe('New Name');
  });

  it('duplicates an existing session', async () => {
    const session = await service.saveSession({ name: 'Template' });
    const duplicated = await service.duplicateSession(session.id);

    expect(duplicated.name).toBe('Template (Copy)');
    expect(duplicated.id).not.toBe(session.id);
    expect(duplicated.tabCount).toBe(session.tabCount);

    const all = await service.getAllSessions();
    expect(all).toHaveLength(2);
  });
});
