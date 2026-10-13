import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Folder } from 'lucide-react';
import type { Workspace } from '../domain/types';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelect: (workspaceId: string | null) => void;
  onCreateNew?: () => void;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onCreateNew,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: activeWorkspace?.color || '#94a3b8' }}
        />
        <span className="truncate max-w-[120px] text-slate-800 dark:text-slate-200">
          {activeWorkspace ? activeWorkspace.name : 'All Workspaces'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Workspace
          </div>

          <button
            type="button"
            role="option"
            aria-selected={activeWorkspaceId === null}
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>All Workspaces</span>
            </div>
            {activeWorkspaceId === null && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              role="option"
              aria-selected={activeWorkspaceId === ws.id}
              onClick={() => {
                onSelect(ws.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ws.color }}
                />
                <span className="truncate">{ws.name}</span>
              </div>
              {activeWorkspaceId === ws.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </button>
          ))}

          {onCreateNew && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workspace...</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
