import React, { useState } from 'react';
import { Bookmark, Plus, Globe, ExternalLink, Trash2, Tag } from 'lucide-react';
import type { TabRecord, Workspace } from '../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface SavedTabsPageProps {
  savedTabs: TabRecord[];
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onOpenTab: (url: string) => void;
  onSaveNewTab: (data: { title: string; url: string; tags: string[]; workspaceId: string | null }) => void;
  onDeleteSavedTab: (id: string) => void;
}

export function SavedTabsPage({
  savedTabs,
  workspaces,
  activeWorkspaceId,
  onOpenTab,
  onSaveNewTab,
  onDeleteSavedTab,
}: SavedTabsPageProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedWsId, setSelectedWsId] = useState<string | null>(activeWorkspaceId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = activeWorkspaceId
    ? savedTabs.filter((t) => t.workspaceId === activeWorkspaceId)
    : savedTabs;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSaveNewTab({
      title: title.trim() || url.trim(),
      url: url.trim(),
      tags,
      workspaceId: selectedWsId,
    });

    setTitle('');
    setUrl('');
    setTagsInput('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Saved Tabs ({filtered.length})
          </h2>
          <p className="text-xs text-slate-400">
            Persistent reference tabs and bookmarks organized across your workspaces.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Tab</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved tabs in this workspace"
          description="Bookmark important tabs or reading materials for later access."
          actionText="Save a Tab"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tab) => (
            <div
              key={tab.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between hover:shadow-xs transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-400 truncate">
                    {tab.domain}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                  {tab.title}
                </h4>
                {tab.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tab.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => onOpenTab(tab.url)}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Tab
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingId(tab.id)}
                  aria-label="Delete saved tab"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Tab Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Save New Tab
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Workspace</label>
                <select
                  value={selectedWsId || ''}
                  onChange={(e) => setSelectedWsId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Unassigned</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="research, tools, design"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-2xs"
                >
                  Save Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Delete saved tab?"
        description="Are you sure you want to remove this tab from your saved bookmarks?"
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (deletingId) {
            onDeleteSavedTab(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
