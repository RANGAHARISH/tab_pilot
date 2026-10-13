import type { Session, SyncMetadata, SyncStatusType, TabGroup, TabRecord, Workspace } from '../domain/types';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter, supabaseAdapter } from '../adapters/supabase-adapter';
import { logger } from '../lib/logger';

export interface SyncStatusInfo {
  status: SyncStatusType;
  lastSyncedAt: string | null;
  pendingCount: number;
  lastError: string | null;
}

export class SyncService {
  private lastSyncedAt: string | null = null;
  private isSyncing = false;
  private lastError: string | null = null;

  constructor(
    private idb: IIndexedDbAdapter = indexedDbAdapter,
    private remote: SupabaseAdapter = supabaseAdapter
  ) {}

  getStatus(): SyncStatusInfo {
    if (!this.remote.isConfigured()) {
      return {
        status: 'local',
        lastSyncedAt: this.lastSyncedAt,
        pendingCount: 0,
        lastError: null,
      };
    }

    return {
      status: this.isSyncing ? 'pending' : this.lastError ? 'error' : 'synced',
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0,
      lastError: this.lastError,
    };
  }

  async runSync(): Promise<SyncStatusInfo> {
    if (!this.remote.isConfigured()) {
      return this.getStatus();
    }

    if (this.isSyncing) {
      logger.info('Sync already in progress, skipping duplicate invocation');
      return this.getStatus();
    }

    this.isSyncing = true;
    this.lastError = null;

    try {
      const user = await this.remote.getCurrentUser();
      if (!user) {
        this.lastError = 'User not authenticated for cloud sync';
        this.isSyncing = false;
        return this.getStatus();
      }

      // 1. Gather all local records
      const [workspaces, sessions, savedTabs] = await Promise.all([
        this.idb.getAll<Workspace>('workspaces', true),
        this.idb.getAll<Session>('sessions', true),
        this.idb.getAll<TabRecord>('saved_tabs', true),
      ]);

      // 2. Push local records to Supabase
      await Promise.all([
        this.remote.syncWorkspaces(workspaces),
        this.remote.syncSessions(sessions),
        this.remote.syncSavedTabs(savedTabs),
      ]);

      // 3. Pull remote changes
      const remoteChanges = await this.remote.pullRemoteChanges(this.lastSyncedAt || undefined);

      // Merge remote workspaces
      for (const rw of remoteChanges.workspaces) {
        const local = await this.idb.get<Workspace>('workspaces', rw.id);
        if (!local || rw.version > local.version || new Date(rw.updatedAt) > new Date(local.updatedAt)) {
          await this.idb.put('workspaces', rw);
        }
      }

      // Merge remote sessions
      for (const rs of remoteChanges.sessions) {
        const local = await this.idb.get<Session>('sessions', rs.id);
        if (!local || rs.version > local.version || new Date(rs.updatedAt) > new Date(local.updatedAt)) {
          await this.idb.put('sessions', rs);
        }
      }

      // Merge remote saved tabs
      for (const rt of remoteChanges.savedTabs) {
        const local = await this.idb.get<TabRecord>('saved_tabs', rt.id);
        if (!local || rt.version > local.version || new Date(rt.savedAt) > new Date(local.savedAt)) {
          await this.idb.put('saved_tabs', rt);
        }
      }

      this.lastSyncedAt = new Date().toISOString();
      logger.info('Synchronization completed successfully at', this.lastSyncedAt);
    } catch (err: unknown) {
      this.lastError = (err as Error)?.message || 'Sync failed';
      logger.error('Sync failed:', err);
    } finally {
      this.isSyncing = false;
    }

    return this.getStatus();
  }
}

export const syncService = new SyncService();
