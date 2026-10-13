import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface PrivacySettingsProps {
  storageUsage: { usage: number; quota: number; percentage: number };
  onClearAllData: () => void;
}

export function PrivacySettings({ storageUsage, onClearAllData }: PrivacySettingsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Privacy & Local Storage
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          TabPilot is built on local-first principles. Your open tabs, browsing sessions, workspaces,
          and preferences are stored directly on your computer inside IndexedDB and Chrome local storage.
          No tracking scripts, external analytics, or mandatory sign-ins are present.
        </p>

        {/* Storage quota */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <HardDrive className="w-4 h-4 text-slate-400" />
              Local Storage Usage
            </span>
            <span className="text-slate-500">
              {formatBytes(storageUsage.usage)} of {formatBytes(storageUsage.quota)} ({storageUsage.percentage}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, storageUsage.percentage)}%` }}
            />
          </div>
        </div>

        {/* Wipe data button */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Wipe Local Database
            </h4>
            <p className="text-[11px] text-slate-400">
              Erase all saved sessions, workspaces, and cached metadata permanently.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Permanently erase all local data?"
        description="This will delete all saved sessions, workspaces, and custom settings stored in TabPilot. This action is irreversible unless you have previously exported a JSON backup."
        confirmText="Erase Everything"
        isDestructive={true}
        onConfirm={() => {
          onClearAllData();
          setIsConfirmOpen(false);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
