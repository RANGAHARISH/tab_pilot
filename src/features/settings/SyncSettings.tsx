import React, { useState, useRef } from 'react';
import { Cloud, Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { SyncStatusType } from '../../domain/types';

interface SyncSettingsProps {
  syncStatus: SyncStatusType;
  lastSyncedAt?: string | null;
  onTriggerSync: () => void;
  onExportData: () => void;
  onImportData: (fileContent: string, overwrite: boolean) => Promise<void>;
}

export function SyncSettings({
  syncStatus,
  lastSyncedAt,
  onTriggerSync,
  onExportData,
  onImportData,
}: SyncSettingsProps) {
  const [overwrite, setOverwrite] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Validating and importing file...');
      const text = await file.text();
      await onImportData(text, overwrite);
      setImportStatus('Import completed successfully!');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: unknown) {
      setImportStatus(`Import failed: ${(err as Error)?.message || 'Invalid format'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud Sync Section */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Multi-Device Cloud Synchronization
            </h3>
          </div>

          <button
            type="button"
            onClick={onTriggerSync}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Cloud sync is entirely optional. When configured with your Supabase backend, your workspaces
          and saved sessions synchronize end-to-end between all your browsers.
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Status:</span>
          <span className="capitalize">{syncStatus}</span>
          {lastSyncedAt && (
            <>
              <span>•</span>
              <span>Last synced {new Date(lastSyncedAt).toLocaleString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Export / Import Section */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Backup & Data Portability
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Export your entire TabPilot library as a standard JSON file. You can import this backup on
          any browser without relying on cloud servers.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import Backup...</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="overwrite-import"
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="overwrite-import" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            Overwrite existing items on conflicting IDs
          </label>
        </div>

        {importStatus && (
          <p
            className={`text-xs font-medium ${
              importStatus.includes('failed') ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {importStatus}
          </p>
        )}
      </div>
    </div>
  );
}
