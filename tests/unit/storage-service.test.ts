import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../../src/services/storage-service';
import { IndexedDbAdapter } from '../../src/adapters/indexeddb-adapter';
import { ChromeStorageAdapter } from '../../src/adapters/chrome-storage-adapter';
import type { ExportDataPayload, Workspace, Session } from '../../src/domain/types';

describe('StorageService', () => {
  let idb: IndexedDbAdapter;
  let storage: ChromeStorageAdapter;
  let service: StorageService;

  beforeEach(async () => {
    const dbName = `TestStorageDB_${Math.random().toString(36).substring(2)}`;
    idb = new IndexedDbAdapter(dbName, 1);
    await idb.init();
    storage = new ChromeStorageAdapter();
    service = new StorageService(idb, storage);
  });

  it('exports and imports full database with validation', async () => {
    const ws: Workspace = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Client Project',
      color: '#059669',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0,
      settings: { isDefault: false },
      version: 1,
      deletedAt: null,
    };
    await idb.put('workspaces', ws);

    const exported = await service.exportAllData();
    expect(exported.version).toBe(1);
    expect(exported.workspaces).toHaveLength(1);
    expect(exported.workspaces[0].name).toBe('Client Project');

    // Clear and re-import
    await idb.clear('workspaces');
    expect(await idb.getAll('workspaces')).toHaveLength(0);

    const summary = await service.importData(exported);
    expect(summary.workspacesImported).toBe(1);

    const reimported = await idb.getAll<Workspace>('workspaces');
    expect(reimported).toHaveLength(1);
    expect(reimported[0].name).toBe('Client Project');
  });

  it('rejects malformed or invalid json payloads during import', async () => {
    await expect(service.importData('{ invalid json ')).rejects.toThrow('Invalid JSON syntax');

    await expect(
      service.importData({
        version: 99, // unsupported future schema version
        workspaces: 'not an array',
      })
    ).rejects.toThrow('Export file format is invalid');
  });
});
