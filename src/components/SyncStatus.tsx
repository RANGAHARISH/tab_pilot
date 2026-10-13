import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SyncStatusType } from '../domain/types';

interface SyncStatusProps {
  status: SyncStatusType;
  lastSyncedAt?: string | null;
  onSyncClick?: () => void;
  isSyncing?: boolean;
}

export function SyncStatus({
  status,
  lastSyncedAt,
  onSyncClick,
  isSyncing = false,
}: SyncStatusProps) {
  if (status === 'local') {
    return (
      <div
        title="Running in local-first mode. Cloud sync is optional and disabled."
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span>Local-only</span>
      </div>
    );
  }

  if (isSyncing || status === 'pending') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 rounded-full border border-blue-200 dark:border-blue-800">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status === 'error' || status === 'conflict') {
    return (
      <button
        type="button"
        onClick={onSyncClick}
        title="Sync issue detected. Click to retry."
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 rounded-full border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Sync Issue</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSyncClick}
      title={lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Cloud sync active'}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Cloud Synced</span>
    </button>
  );
}
