import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Workspace } from '../../domain/types';

interface WorkspaceEditorProps {
  isOpen: boolean;
  workspaceToEdit: Workspace | null;
  onSave: (data: {
    id?: string;
    name: string;
    description: string;
    color: string;
    isDefault: boolean;
  }) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#475569', // Slate
];

export function WorkspaceEditor({
  isOpen,
  workspaceToEdit,
  onSave,
  onClose,
}: WorkspaceEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspaceToEdit) {
      setName(workspaceToEdit.name);
      setDescription(workspaceToEdit.description || '');
      setColor(workspaceToEdit.color || '#2563eb');
      setIsDefault(workspaceToEdit.settings.isDefault);
    } else {
      setName('');
      setDescription('');
      setColor('#2563eb');
      setIsDefault(false);
    }
    setError('');
  }, [workspaceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    onSave({
      id: workspaceToEdit ? workspaceToEdit.id : undefined,
      name: name.trim(),
      description: description.trim(),
      color,
      isDefault,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="workspace-editor-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {workspaceToEdit ? 'Edit Workspace' : 'Create New Workspace'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <div className="space-y-1">
            <label htmlFor="ws-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Workspace Name *
            </label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design System, Project Titan"
              autoFocus
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ws-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Description (optional)
            </label>
            <textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief context or goals for this workspace"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Color Tag</label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="ws-default"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="ws-default" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              Set as default workspace for new sessions
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {workspaceToEdit ? 'Update Workspace' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
