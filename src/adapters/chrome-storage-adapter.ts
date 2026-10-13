import { StorageError } from '../domain/errors';
import { logger } from '../lib/logger';

export interface IChromeStorageAdapter {
  get<T>(key: string, defaultValue: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class ChromeStorageAdapter implements IChromeStorageAdapter {
  private memFallback: Map<string, unknown> = new Map();

  private isChromeStorageAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.storage !== 'undefined' &&
      typeof chrome.storage.local !== 'undefined'
    );
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            logger.warn(`chrome.storage.local.get error for ${key}:`, chrome.runtime.lastError.message);
            resolve(defaultValue);
          } else {
            resolve(result[key] !== undefined ? (result[key] as T) : defaultValue);
          }
        });
      });
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const item = localStorage.getItem(`tabpilot_${key}`);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } catch (err) {
        logger.warn(`localStorage read error for ${key}:`, err);
        return defaultValue;
      }
    }

    return (this.memFallback.get(key) as T) ?? defaultValue;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            const err = new StorageError(
              chrome.runtime.lastError.message || `Failed to set key ${key}`
            );
            logger.error(`chrome.storage.local.set error for ${key}:`, err);
            return reject(err);
          }
          resolve();
        });
      });
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`tabpilot_${key}`, JSON.stringify(value));
        return;
      } catch (err) {
        throw new StorageError(`Failed to save ${key} to localStorage: ${String(err)}`);
      }
    }

    this.memFallback.set(key, value);
  }

  async remove(key: string): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            return reject(new StorageError(chrome.runtime.lastError.message || `Failed to remove key ${key}`));
          }
          resolve();
        });
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`tabpilot_${key}`);
      return;
    }

    this.memFallback.delete(key);
  }

  async clear(): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            return reject(new StorageError(chrome.runtime.lastError.message || 'Failed to clear chrome.storage'));
          }
          resolve();
        });
      });
    }

    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('tabpilot_'));
      keys.forEach((k) => localStorage.removeItem(k));
      return;
    }

    this.memFallback.clear();
  }
}

export const storageAdapter = new ChromeStorageAdapter();
