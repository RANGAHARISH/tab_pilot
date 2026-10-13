import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceService } from '../../src/services/workspace-service';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import type { Session, TabRecord } from '../../src/domain/types';

describe('WorkspaceService', () => {
  let db: IndexedDbAdapter;
  let service: WorkspaceService;

  beforeEach(async () => {
    const dbName = `TestWsDB_${Math.random().toString(36).substring(2)}`;
    db = new IndexedDbAdapter(dbName, 1);
    await db.init();
    service = new WorkspaceService(db);
  });

  it('seeds default workspaces if storage is initially empty', async () => {
    const list = await service.getAllWorkspaces();
    expect(list.length).toBeGreaterThanOrEqual(3);

    const defaultWs = await service.getDefaultWorkspace();
    expect(defaultWs).not.toBeNull();
    expect(defaultWs?.name).toBe('Personal');
    expect(defaultWs?.settings.isDefault).toBe(true);
  });

  it('creates and updates a new workspace', async () => {
    const ws = await service.createWorkspace({
      name: 'Project Mars',
      color: '#dc2626',
      description: 'Exploration tabs',
    });

    expect(ws.name).toBe('Project Mars');
    expect(ws.color).toBe('#dc2626');

    const updated = await service.updateWorkspace(ws.id, { name: 'Project Jupiter' });
    expect(updated.name).toBe('Project Jupiter');
    expect(updated.version).toBe(2);
  });

  it('migrates associated sessions when deleting a workspace', async () => {
    const ws1 = await service.createWorkspace({ name: 'Old Workspace' });
    const ws2 = await service.createWorkspace({ name: 'New Workspace' });

    // Put a session associated with ws1
    const testSession: Session = {
      id: 'sess_123',
      name: 'Migration Test',
      workspaceId: ws1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tabs: [],
      tabCount: 0,
      restoreOptions: { openInNewWindow: false, avoidDuplicates: true },
      version: 1,
      deletedAt: null,
    };
    await db.put('sessions', testSession);

    // Delete ws1 and migrate to ws2
    await service.deleteWorkspace(ws1.id, ws2.id);

    const migratedSession = await db.get<Session>('sessions', 'sess_123');
    expect(migratedSession?.workspaceId).toBe(ws2.id);
  });
});
