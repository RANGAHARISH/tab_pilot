import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock chrome API globally for tests
const mockStorage: Record<string, any> = {};

(globalThis as any).chrome = {
  runtime: {
    id: 'test-extension-id',
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
    lastError: null,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn((queryInfo, callback) => callback([])),
    get: vi.fn((tabId, callback) => callback({ id: tabId, url: 'https://example.com', title: 'Example' })),
    create: vi.fn((props, callback) => callback?.({ id: 100, ...props })),
    update: vi.fn((tabId, props, callback) => callback?.({ id: tabId, ...props })),
    remove: vi.fn((tabIds, callback) => callback?.()),
    move: vi.fn((tabIds, moveProperties, callback) => callback?.([])),
    group: vi.fn((options, callback) => callback?.(1)),
    ungroup: vi.fn((tabIds, callback) => callback?.()),
    onCreated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onActivated: { addListener: vi.fn() },
  },
  windows: {
    create: vi.fn((props, callback) => callback?.({ id: 1, tabs: [] })),
    update: vi.fn((windowId, props, callback) => callback?.({})),
    getAll: vi.fn((props, callback) => callback?.([])),
  },
  tabGroups: {
    update: vi.fn((groupId, props, callback) => callback?.({})),
  },
  sessions: {
    getRecentlyClosed: vi.fn((filter, callback) => callback?.([])),
    restore: vi.fn((sessionId, callback) => callback?.({})),
  },
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        if (typeof keys === 'string') {
          callback({ [keys]: mockStorage[keys] });
        } else if (Array.isArray(keys)) {
          const res: Record<string, any> = {};
          keys.forEach((k) => (res[k] = mockStorage[k]));
          callback(res);
        } else if (keys && typeof keys === 'object') {
          const res: Record<string, any> = {};
          Object.keys(keys).forEach((k) => {
            res[k] = mockStorage[k] !== undefined ? mockStorage[k] : keys[k];
          });
          callback(res);
        } else {
          callback(mockStorage);
        }
      }),
      set: vi.fn((items, callback) => {
        Object.assign(mockStorage, items);
        callback?.();
      }),
      remove: vi.fn((keys, callback) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        arr.forEach((k) => delete mockStorage[k]);
        callback?.();
      }),
      clear: vi.fn((callback) => {
        Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
        callback?.();
      }),
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
};
