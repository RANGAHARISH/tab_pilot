import React, { useState } from 'react';
import { FolderKanban, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { WorkspaceEditor } from './WorkspaceEditor';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Workspace } from '../../domain/types';

interface WorkspaceListProps {
  workspaces: Workspace[];
  onSaveWorkspace: (data: {
    id?: string;
    name: string;
    description: string;
    color: string;
    isDefault: boolean;
  }) => void;
  onDeleteWorkspace: (id: string, moveToWorkspaceId?: string | null) => void;
  onSetDefault: (id: string) => void;
}

export function WorkspaceList({
  workspaces,
  onSaveWorkspace,
  onDeleteWorkspace,
  onSetDefault,
}: WorkspaceListProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [moveToWorkspaceId, setMoveToWorkspaceId] = useState<string>('');

  const handleCreateNew = () => {
    setEditingWorkspace(null);
    setEditorOpen(true);
  };

  const handleEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setEditorOpen(true);
  };

  const candidateReassignWorkspaces = workspaces.filter((w) => w.id !== deletingWorkspaceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Workspaces ({workspaces.length})
          </h2>
          <p className="text-xs text-slate-400">
            Segment your tabs, sessions, and bookmarks by project or topic.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="flex flex-col justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-shadow relative overflow-hidden"
          >
            {/* Color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: ws.color }}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ws.color }}
                  />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                    {ws.name}
                  </h3>
                </div>

                {ws.settings.isDefault && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Default
                  </span>
                )}
              </div>

              {ws.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {ws.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              {!ws.settings.isDefault ? (
                <button
                  type="button"
                  onClick={() => onSetDefault(ws.id)}
                  className="text-slate-500 hover:text-blue-600 font-medium"
                >
                  Make Default
                </button>
              ) : (
                <span className="text-slate-400 font-medium">Active Default</span>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(ws)}
                  title="Edit workspace"
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {workspaces.length > 1 && !ws.settings.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingWorkspaceId(ws.id);
                      setMoveToWorkspaceId(candidateReassignWorkspaces[0]?.id || '');
                    }}
                    title="Delete workspace"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <WorkspaceEditor
        isOpen={editorOpen}
        workspaceToEdit={editingWorkspace}
        onSave={onSaveWorkspace}
        onClose={() => setEditorOpen(false)}
      />

      {/* Delete Workspace Dialog */}
      {deletingWorkspaceId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Delete Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Where would you like to move existing sessions and saved tabs assigned to this workspace?
            </p>

            {candidateReassignWorkspaces.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Move items to:
                </label>
                <select
                  value={moveToWorkspaceId}
                  onChange={(e) => setMoveToWorkspaceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {candidateReassignWorkspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                  <option value="">Do not move (leave unassigned)</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWorkspaceId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWorkspace(deletingWorkspaceId, moveToWorkspaceId || null);
                  setDeletingWorkspaceId(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
