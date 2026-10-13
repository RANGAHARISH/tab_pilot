import React, { useState } from 'react';
import { Clock, Plus, BookmarkPlus } from 'lucide-react';
import { SessionCard } from '../../components/SessionCard';
import { SessionDetails } from './SessionDetails';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Session } from '../../domain/types';

interface SessionListProps {
  sessions: Session[];
  onRestoreSession: (sessionId: string, openInNewWindow: boolean) => void;
  onRestoreTabs: (urls: string[], openInNewWindow: boolean) => void;
  onSaveCurrentWindow: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDuplicateSession: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  onRestoreSession,
  onRestoreTabs,
  onSaveCurrentWindow,
  onDeleteSession,
  onRenameSession,
  onDuplicateSession,
}: SessionListProps) {
  const [activeSessionForDetails, setActiveSessionForDetails] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionToRename, setSessionToRename] = useState<Session | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleStartRename = (sessionId: string) => {
    const sess = sessions.find((s) => s.id === sessionId);
    if (sess) {
      setSessionToRename(sess);
      setRenameInput(sess.name);
    }
  };

  const handleConfirmRename = () => {
    if (sessionToRename && renameInput.trim()) {
      onRenameSession(sessionToRename.id, renameInput.trim());
      setSessionToRename(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No saved sessions yet"
        description="Snapshot your open browser tabs into named sessions to easily restore them anytime."
        actionText="Save Current Window"
        onAction={onSaveCurrentWindow}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Saved Sessions ({sessions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Restore tabs in your active window or open a dedicated new window.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveCurrentWindow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Save Current Window</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRestore={onRestoreSession}
            onRename={handleStartRename}
            onDuplicate={onDuplicateSession}
            onDelete={(id) => setSessionToDelete(id)}
          />
        ))}
      </div>

      {activeSessionForDetails && (
        <SessionDetails
          session={activeSessionForDetails}
          onClose={() => setActiveSessionForDetails(null)}
          onRestoreTabs={onRestoreTabs}
          onDeleteSession={onDeleteSession}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={sessionToDelete !== null}
        title="Delete Session?"
        description="Are you sure you want to delete this saved session? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (sessionToDelete) {
            onDeleteSession(sessionToDelete);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />

      {/* Rename dialog */}
      {sessionToRename && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rename Session</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Session name"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionToRename(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
