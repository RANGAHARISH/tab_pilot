import React from 'react';
import { Settings, Shield, Sliders } from 'lucide-react';
import { PrivacySettings } from './PrivacySettings';
import { SyncSettings } from './SyncSettings';
import type { UserPreferences, SyncStatusType, ThemeOption } from '../../domain/types';

interface SettingsPageProps {
  preferences: UserPreferences;
  storageUsage: { usage: number; quota: number; percentage: number };
  syncStatus: SyncStatusType;
  lastSyncedAt?: string | null;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onTriggerSync: () => void;
  onExportData: () => void;
  onImportData: (content: string, overwrite: boolean) => Promise<void>;
  onClearAllData: () => void;
}

export function SettingsPage({
  preferences,
  storageUsage,
  syncStatus,
  lastSyncedAt,
  onUpdatePreferences,
  onTriggerSync,
  onExportData,
  onImportData,
  onClearAllData,
}: SettingsPageProps) {
  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings & Preferences</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize TabPilot&apos;s behavior, privacy controls, sync options, and theme.
        </p>
      </div>

      {/* General Preferences */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Interface & Interaction
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Appearance Theme</p>
              <p className="text-slate-400">Choose between light, dark, or system preference</p>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => onUpdatePreferences({ theme: e.target.value as ThemeOption })}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Closing Confirmation</p>
              <p className="text-slate-400">Always ask before closing multiple tabs or duplicates</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.confirmBeforeClosingTabs}
              onChange={(e) =>
                onUpdatePreferences({ confirmBeforeClosingTabs: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Reduced Motion</p>
              <p className="text-slate-400">Disable non-essential animations across the extension</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => onUpdatePreferences({ reducedMotion: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Sync and Portability */}
      <SyncSettings
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerSync={onTriggerSync}
        onExportData={onExportData}
        onImportData={onImportData}
      />

      {/* Privacy and Storage */}
      <PrivacySettings storageUsage={storageUsage} onClearAllData={onClearAllData} />
    </div>
  );
}
