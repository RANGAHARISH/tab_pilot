import { ExportDataPayloadSchema } from '../domain/schemas';
import type { ExportDataPayload, Session, TabGroup, TabRecord, UserPreferences, Workspace } from '../domain/types';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { IChromeStorageAdapter, storageAdapter } from '../adapters/chrome-storage-adapter';
import { ValidationError, StorageError } from '../domain/errors';
import { logger } from '../lib/logger';

export interface ImportSummary {
  workspacesImported: number;
  sessionsImported: number;
  savedTabsImported: number;
  tabGroupsImported: number;
  conflictsSkipped: number;
}

export class StorageService {
  constructor(
    private idb: IIndexedDbAdapter = indexedDbAdapter,
    private storage: IChromeStorageAdapter = storageAdapter
  ) {}

  async exportAllData(): Promise<ExportDataPayload> {
    const [workspaces, sessions, savedTabs, tabGroups, preferences] = await Promise.all([
      this.idb.getAll<Workspace>('workspaces', false),
      this.idb.getAll<Session>('sessions', false),
      this.idb.getAll<TabRecord>('saved_tabs', false),
      this.idb.getAll<TabGroup>('tab_groups', false),
      this.storage.get<UserPreferences>('preferences', {
        theme: 'system',
        defaultWorkspaceId: null,
        autoSaveSessions: false,
        confirmBeforeClosingTabs: true,
        enableAI: false,
        enableCloudSync: false,
        syncIntervalMinutes: 15,
        reducedMotion: false,
      }),
    ]);

    const payload: ExportDataPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workspaces,
      sessions,
      savedTabs,
      tabGroups,
      preferences,
    };

    return ExportDataPayloadSchema.parse(payload);
  }

  async importData(
    rawJson: string | object,
    options: { overwriteConflicts?: boolean } = {}
  ): Promise<ImportSummary> {
    let parsedJson: unknown;
    try {
      parsedJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    } catch (err) {
      throw new ValidationError('Invalid JSON syntax');
    }

    const parseResult = ExportDataPayloadSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      throw new ValidationError('Export file format is invalid or unsupported', parseResult.error.issues);
    }

    const data = parseResult.data;
    const summary: ImportSummary = {
      workspacesImported: 0,
      sessionsImported: 0,
      savedTabsImported: 0,
      tabGroupsImported: 0,
      conflictsSkipped: 0,
    };

    // Import workspaces
    for (const ws of data.workspaces) {
      const existing = await this.idb.get<Workspace>('workspaces', ws.id);
      if (existing && !options.overwriteConflicts) {
        summary.conflictsSkipped++;
      } else {
        await this.idb.put('workspaces', ws);
        summary.workspacesImported++;
      }
    }

    // Import sessions
    for (const sess of data.sessions) {
      const existing = await this.idb.get<Session>('sessions', sess.id);
      if (existing && !options.overwriteConflicts) {
        summary.conflictsSkipped++;
      } else {
        await this.idb.put('sessions', sess);
        summary.sessionsImported++;
      }
    }

    // Import saved tabs
    for (const tab of data.savedTabs) {
      const existing = await this.idb.get<TabRecord>('saved_tabs', tab.id);
      if (existing && !options.overwriteConflicts) {
        summary.conflictsSkipped++;
      } else {
        await this.idb.put('saved_tabs', tab);
        summary.savedTabsImported++;
      }
    }

    // Import tab groups
    for (const grp of data.tabGroups) {
      const existing = await this.idb.get<TabGroup>('tab_groups', grp.id);
      if (existing && !options.overwriteConflicts) {
        summary.conflictsSkipped++;
      } else {
        await this.idb.put('tab_groups', grp);
        summary.tabGroupsImported++;
      }
    }

    // Import preferences
    if (data.preferences) {
      await this.storage.set('preferences', data.preferences);
    }

    logger.info('Import finished:', summary);
    return summary;
  }

  async clearAllLocalData(): Promise<void> {
    await Promise.all([
      this.idb.clear('workspaces'),
      this.idb.clear('sessions'),
      this.idb.clear('saved_tabs'),
      this.idb.clear('tab_groups'),
      this.idb.clear('sync_metadata'),
      this.storage.clear(),
    ]);
    logger.info('All local data cleared');
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usage = est.usage || 0;
        const quota = est.quota || 1;
        const percentage = Math.min(100, Math.round((usage / quota) * 100));
        return { usage, quota, percentage };
      } catch (err) {
        logger.warn('Failed to get storage estimate:', err);
      }
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }
}

export const storageService = new StorageService();
