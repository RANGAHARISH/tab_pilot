import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../../src/services/session-service';
import { WorkspaceService } from '../../src/services/workspace-service';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import type { ITabsAdapter } from '../../src/adapters/chrome-tabs-adapter';
import type { BrowserTab } from '../../src/domain/types';

describe('Integration: Session Save, Workspace Assignment, and Restore Workflow', () => {
  let db: IndexedDbAdapter;
  let mockTabsAdapter: ITabsAdapter;
  let sessionService: SessionService;
  let workspaceService: WorkspaceService;
  let createdTabs: { url: string; active?: boolean }[];

  const initialTabs: BrowserTab[] = [
    {
      id: 11,
      windowId: 1,
      url: 'https://linear.app/issue/TAB-101',
      title: 'TAB-101: Tab Management Design',
      active: true,
      pinned: false,
      incognito: false,
      index: 0,
    },
    {
      id: 12,
      windowId: 1,
      url: 'https://figma.com/file/xyz/TabsUI',
      title: 'Figma - Tabs UI Design System',
      active: false,
      pinned: false,
      incognito: false,
      index: 1,
    },
  ];

  beforeEach(async () => {
    createdTabs = [];
    const dbName = `TestWorkflowDB_${Math.random().toString(36).substring(2)}`;
    db = new IndexedDbAdapter(dbName, 1);
    await db.init();

    mockTabsAdapter = {
      queryTabs: vi.fn(async () => initialTabs),
      getTab: vi.fn(),
      createTab: vi.fn(async (props) => {
        createdTabs.push(props);
        return {
          id: 99,
          windowId: 1,
          url: props.url || '',
          title: '',
          active: !!props.active,
          pinned: !!props.pinned,
        };
      }),
      updateTab: vi.fn(),
      closeTabs: vi.fn(),
      moveTabs: vi.fn(),
      pinTab: vi.fn(),
      createGroup: vi.fn(),
      ungroupTabs: vi.fn(),
      createWindow: vi.fn(async (urls: string[]) => {
        urls.forEach((u: string) => createdTabs.push({ url: u }));
        return { id: 10, tabs: [], focused: true, alwaysOnTop: false, incognito: false };
      }),
      getAllWindows: vi.fn(),
      getRecentlyClosed: vi.fn(),
      restoreRecentlyClosed: vi.fn(),
      extractPageContent: vi.fn(),
    };

    sessionService = new SessionService(db, mockTabsAdapter);
    workspaceService = new WorkspaceService(db);
  });

  it('creates workspace, saves window session assigned to it, and restores session tabs', async () => {
    // 1. Create Workspace
    const ws = await workspaceService.createWorkspace({
      name: 'Product Design Sprint',
      color: '#7c3aed',
      description: 'Sprint 42 design tabs',
    });

    // 2. Save Session into Workspace
    const session = await sessionService.saveSession({
      name: 'Design Sprint Setup',
      workspaceId: ws.id,
      currentWindowOnly: true,
    });

    expect(session.workspaceId).toBe(ws.id);
    expect(session.tabCount).toBe(2);

    // 3. Clear open tabs simulation
    mockTabsAdapter.queryTabs = vi.fn(async () => []);

    // 4. Restore Session
    const restoreResult = await sessionService.restoreSession(session.id, {
      openInNewWindow: false,
      avoidDuplicates: true,
    });

    expect(restoreResult.restoredCount).toBe(2);
    expect(createdTabs).toHaveLength(2);
    expect(createdTabs.map((t) => t.url)).toEqual([
      'https://linear.app/issue/TAB-101',
      'https://figma.com/file/xyz/TabsUI',
    ]);
  });
});
