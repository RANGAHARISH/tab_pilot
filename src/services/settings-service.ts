import { UserPreferencesSchema } from '../domain/schemas';
import type { UserPreferences } from '../domain/types';
import { IChromeStorageAdapter, storageAdapter } from '../adapters/chrome-storage-adapter';
import { logger } from '../lib/logger';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultWorkspaceId: null,
  autoSaveSessions: false,
  confirmBeforeClosingTabs: true,
  enableAI: false,
  enableCloudSync: false,
  syncIntervalMinutes: 15,
  reducedMotion: false,
};

export class SettingsService {
  constructor(private storage: IChromeStorageAdapter = storageAdapter) {}

  async getPreferences(): Promise<UserPreferences> {
    const raw = await this.storage.get<UserPreferences>('preferences', DEFAULT_PREFERENCES);
    const parsed = UserPreferencesSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }
    logger.warn('Stored preferences failed validation, using defaults');
    return DEFAULT_PREFERENCES;
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const merged: UserPreferences = {
      ...current,
      ...updates,
    };

    const validated = UserPreferencesSchema.parse(merged);
    await this.storage.set('preferences', validated);
    this.applyTheme(validated.theme);
    return validated;
  }

  applyTheme(theme: UserPreferences['theme']): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export const settingsService = new SettingsService();
