import { SessionSchema } from '../domain/schemas';
import type { Session, SavedTabSnapshot, SessionRestoreOptions, BrowserTab } from '../domain/types';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { ITabsAdapter, tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { extractDomain, areUrlsDuplicates, isValidWebUrl } from '../lib/url-utils';
import { ValidationError, TabOperationError } from '../domain/errors';
import { logger } from '../lib/logger';

export interface RestoreProgress {
  current: number;
  total: number;
  tabUrl: string;
  succeeded: boolean;
  error?: string;
}

export class SessionService {
  constructor(
    private db: IIndexedDbAdapter = indexedDbAdapter,
    private tabs: ITabsAdapter = tabsAdapter
  ) {}

  async getAllSessions(includeDeleted = false): Promise<Session[]> {
    const list = await this.db.getAll<Session>('sessions', includeDeleted);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.db.get<Session>('sessions', id);
  }

  async saveSession(options: {
    name?: string;
    workspaceId?: string | null;
    tabIds?: number[];
    currentWindowOnly?: boolean;
  } = {}): Promise<Session> {
    let rawTabs: BrowserTab[] = [];

    if (options.tabIds && options.tabIds.length > 0) {
      const allTabs = await this.tabs.queryTabs();
      const tabIdSet = new Set(options.tabIds);
      rawTabs = allTabs.filter((t) => tabIdSet.has(t.id));
    } else if (options.currentWindowOnly !== false) {
      rawTabs = await this.tabs.queryTabs({ currentWindow: true });
    } else {
      rawTabs = await this.tabs.queryTabs({});
    }

    // Filter out un-restorable blank or extension internal tabs
    const validTabs = rawTabs.filter((t) => t.url && !t.url.startsWith('chrome-extension://'));

    const snapshots: SavedTabSnapshot[] = validTabs.map((t) => ({
      id: crypto.randomUUID(),
      url: t.url,
      title: t.title || 'Untitled',
      faviconUrl: t.favIconUrl || null,
      domain: extractDomain(t.url),
      pinned: t.pinned,
    }));

    const now = new Date().toISOString();
    const sessionName =
      options.name?.trim() ||
      `Session ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    const newSession: Session = {
      id: crypto.randomUUID(),
      name: sessionName,
      createdAt: now,
      updatedAt: now,
      workspaceId: options.workspaceId || null,
      tabs: snapshots,
      tabCount: snapshots.length,
      restoreOptions: {
        openInNewWindow: false,
        avoidDuplicates: true,
      },
      version: 1,
      deletedAt: null,
    };

    const validated = SessionSchema.parse(newSession);
    await this.db.put('sessions', validated);
    logger.info(`Saved session "${sessionName}" with ${snapshots.length} tabs`);
    return validated;
  }

  async restoreSession(
    sessionId: string,
    optionsOverride?: Partial<SessionRestoreOptions>,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<{ restoredCount: number; skippedCount: number; errors: string[] }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new ValidationError(`Session with ID ${sessionId} not found`);
    }

    const restoreOpts: SessionRestoreOptions = {
      ...session.restoreOptions,
      ...optionsOverride,
    };

    const openTabs = await this.tabs.queryTabs();
    const urlsToOpen: string[] = [];
    let skippedCount = 0;
    const errors: string[] = [];

    for (const snap of session.tabs) {
      if (!isValidWebUrl(snap.url) && !snap.url.startsWith('chrome://')) {
        skippedCount++;
        continue;
      }

      if (restoreOpts.avoidDuplicates) {
        const isDuplicate = openTabs.some((ot) => areUrlsDuplicates(ot.url, snap.url));
        if (isDuplicate) {
          skippedCount++;
          continue;
        }
      }

      urlsToOpen.push(snap.url);
    }

    let restoredCount = 0;

    if (restoreOpts.openInNewWindow && urlsToOpen.length > 0) {
      try {
        await this.tabs.createWindow(urlsToOpen);
        restoredCount = urlsToOpen.length;
        urlsToOpen.forEach((url, i) => {
          onProgress?.({
            current: i + 1,
            total: urlsToOpen.length,
            tabUrl: url,
            succeeded: true,
          });
        });
      } catch (err) {
        logger.error('Failed to create new window during session restore:', err);
        errors.push(`Window creation failed: ${String(err)}`);
      }
    } else {
      for (let i = 0; i < urlsToOpen.length; i++) {
        const url = urlsToOpen[i];
        try {
          await this.tabs.createTab({ url, active: i === 0 });
          restoredCount++;
          onProgress?.({
            current: i + 1,
            total: urlsToOpen.length,
            tabUrl: url,
            succeeded: true,
          });
        } catch (err) {
          logger.warn(`Failed to restore tab ${url}:`, err);
          errors.push(`Failed to open ${url}`);
          onProgress?.({
            current: i + 1,
            total: urlsToOpen.length,
            tabUrl: url,
            succeeded: false,
            error: String(err),
          });
        }
      }
    }

    return { restoredCount, skippedCount, errors };
  }

  async renameSession(id: string, newName: string): Promise<Session> {
    const session = await this.getSessionById(id);
    if (!session) throw new ValidationError(`Session ${id} not found`);

    session.name = newName.trim();
    session.updatedAt = new Date().toISOString();
    session.version += 1;

    const validated = SessionSchema.parse(session);
    await this.db.put('sessions', validated);
    return validated;
  }

  async duplicateSession(id: string): Promise<Session> {
    const session = await this.getSessionById(id);
    if (!session) throw new ValidationError(`Session ${id} not found`);

    const now = new Date().toISOString();
    const duplicated: Session = {
      ...session,
      id: crypto.randomUUID(),
      name: `${session.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
    };

    const validated = SessionSchema.parse(duplicated);
    await this.db.put('sessions', validated);
    return validated;
  }

  async deleteSession(id: string, soft = true): Promise<void> {
    await this.db.delete('sessions', id, soft);
  }
}

export const sessionService = new SessionService();
