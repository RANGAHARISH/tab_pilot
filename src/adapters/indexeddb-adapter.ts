import { StorageError, QuotaExceededError } from '../domain/errors';
import { logger } from '../lib/logger';

export const DB_NAME = 'TabPilotDB';
export const DB_VERSION = 1;

export type StoreName =
  | 'workspaces'
  | 'sessions'
  | 'saved_tabs'
  | 'tab_groups'
  | 'sync_metadata';

export interface IIndexedDbAdapter {
  init(): Promise<void>;
  get<T>(storeName: StoreName, id: string): Promise<T | null>;
  getAll<T>(storeName: StoreName, includeDeleted?: boolean): Promise<T[]>;
  put<T extends { id?: string; entityId?: string }>(storeName: StoreName, item: T): Promise<void>;
  putBatch<T extends { id?: string; entityId?: string }>(storeName: StoreName, items: T[]): Promise<void>;
  delete(storeName: StoreName, id: string, soft?: boolean): Promise<void>;
  clear(storeName: StoreName): Promise<void>;
  close(): void;
}

export class IndexedDbAdapter implements IIndexedDbAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private dbName: string;
  private dbVersion: number;

  constructor(dbName: string = DB_NAME, dbVersion: number = DB_VERSION) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new StorageError('IndexedDB is not supported in this environment'));
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.runMigrations(db, event.oldVersion);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        logger.info(`IndexedDB initialized successfully (${this.dbName} v${this.dbVersion})`);
        resolve();
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        logger.error('Failed to open IndexedDB:', error);
        reject(new StorageError(error?.message || 'Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        logger.warn('IndexedDB upgrade blocked: please close other tabs running TabPilot');
      };
    });

    return this.initPromise;
  }

  private runMigrations(db: IDBDatabase, oldVersion: number) {
    if (oldVersion < 1) {
      // Create workspaces store
      if (!db.objectStoreNames.contains('workspaces')) {
        const wsStore = db.createObjectStore('workspaces', { keyPath: 'id' });
        wsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        wsStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        wsStore.createIndex('sortOrder', 'sortOrder', { unique: false });
      }

      // Create sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        sessionStore.createIndex('deletedAt', 'deletedAt', { unique: false });
      }

      // Create saved_tabs store
      if (!db.objectStoreNames.contains('saved_tabs')) {
        const tabStore = db.createObjectStore('saved_tabs', { keyPath: 'id' });
        tabStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        tabStore.createIndex('url', 'url', { unique: false });
        tabStore.createIndex('domain', 'domain', { unique: false });
        tabStore.createIndex('updatedAt', 'savedAt', { unique: false });
        tabStore.createIndex('deletedAt', 'deletedAt', { unique: false });
      }

      // Create tab_groups store
      if (!db.objectStoreNames.contains('tab_groups')) {
        const groupStore = db.createObjectStore('tab_groups', { keyPath: 'id' });
        groupStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        groupStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        groupStore.createIndex('deletedAt', 'deletedAt', { unique: false });
      }

      // Create sync_metadata store
      if (!db.objectStoreNames.contains('sync_metadata')) {
        const syncStore = db.createObjectStore('sync_metadata', { keyPath: 'entityId' });
        syncStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        syncStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    }
  }

  private async getStore(
    storeName: StoreName,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<{ store: IDBObjectStore; tx: IDBTransaction }> {
    await this.init();
    if (!this.db) throw new StorageError('Database is not initialized');

    try {
      const tx = this.db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      return { store, tx };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw new StorageError(`Transaction failed for store ${storeName}: ${String(err)}`);
    }
  }

  async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    const { store } = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(new StorageError(request.error?.message || `Failed to get item ${id}`));
    });
  }

  async getAll<T>(storeName: StoreName, includeDeleted = false): Promise<T[]> {
    const { store } = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = (request.result as T[]) || [];
        if (!includeDeleted) {
          results = results.filter((item) => {
            const cast = item as { deletedAt?: string | null };
            return !cast.deletedAt;
          });
        }
        resolve(results);
      };
      request.onerror = () => reject(new StorageError(request.error?.message || `Failed to getAll from ${storeName}`));
    });
  }

  async put<T extends { id?: string; entityId?: string }>(
    storeName: StoreName,
    item: T
  ): Promise<void> {
    const { store, tx } = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.put(item);

      request.onsuccess = () => {
        // Automatically queue sync metadata if entity has id and is not sync_metadata
        resolve();
      };

      request.onerror = (e) => {
        if (request.error?.name === 'QuotaExceededError') {
          reject(new QuotaExceededError());
        } else {
          reject(new StorageError(request.error?.message || `Failed to put item in ${storeName}`));
        }
      };

      tx.onerror = (e) => {
        if (tx.error?.name === 'QuotaExceededError') {
          reject(new QuotaExceededError());
        }
      };
    });
  }

  async putBatch<T extends { id?: string; entityId?: string }>(
    storeName: StoreName,
    items: T[]
  ): Promise<void> {
    if (items.length === 0) return;
    const { store, tx } = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        if (tx.error?.name === 'QuotaExceededError') {
          reject(new QuotaExceededError());
        } else {
          reject(new StorageError(tx.error?.message || `Failed to put batch in ${storeName}`));
        }
      };

      for (const item of items) {
        store.put(item);
      }
    });
  }

  async delete(storeName: StoreName, id: string, soft = true): Promise<void> {
    if (soft) {
      const existing = await this.get<Record<string, unknown>>(storeName, id);
      if (existing) {
        existing.deletedAt = new Date().toISOString();
        existing.version = ((existing.version as number) || 1) + 1;
        await this.put(storeName, existing as { id?: string });
      }
      return;
    }

    const { store } = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(request.error?.message || `Failed to delete ${id}`));
    });
  }

  async clear(storeName: StoreName): Promise<void> {
    const { store } = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(request.error?.message || `Failed to clear ${storeName}`));
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

export const indexedDbAdapter = new IndexedDbAdapter();
