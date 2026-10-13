import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';

describe('IndexedDbAdapter', () => {
  let adapter: IndexedDbAdapter;

  beforeEach(async () => {
    // Unique database name per test to prevent test cross-contamination
    const dbName = `TestTabPilotDB_${Math.random().toString(36).substring(2)}`;
    adapter = new IndexedDbAdapter(dbName, 1);
    await adapter.init();
  });

  it('puts, gets, and lists items from object store', async () => {
    const item = {
      id: 'ws_1',
      name: 'Project Alpha',
      color: '#2563eb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0,
      settings: { isDefault: false },
      version: 1,
      deletedAt: null,
    };

    await adapter.put('workspaces', item);
    const retrieved = await adapter.get<typeof item>('workspaces', 'ws_1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Project Alpha');

    const all = await adapter.getAll<typeof item>('workspaces');
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('ws_1');
  });

  it('performs soft-delete by setting deletedAt tombstone', async () => {
    const item = {
      id: 'ws_soft',
      name: 'To Soft Delete',
      color: '#dc2626',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 1,
      settings: { isDefault: false },
      version: 1,
      deletedAt: null,
    };

    await adapter.put('workspaces', item);
    await adapter.delete('workspaces', 'ws_soft', true);

    const activeItems = await adapter.getAll('workspaces', false);
    expect(activeItems).toHaveLength(0);

    const allWithTombstones = await adapter.getAll<typeof item>('workspaces', true);
    expect(allWithTombstones).toHaveLength(1);
    expect(allWithTombstones[0].deletedAt).not.toBeNull();
  });

  it('clears all items in an object store', async () => {
    await adapter.put('workspaces', { id: 'w1', name: 'W1', deletedAt: null });
    await adapter.put('workspaces', { id: 'w2', name: 'W2', deletedAt: null });

    await adapter.clear('workspaces');
    const all = await adapter.getAll('workspaces', true);
    expect(all).toHaveLength(0);
  });
});
