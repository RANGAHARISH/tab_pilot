import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { SearchContentType } from '../services/search-service';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  selectedType?: SearchContentType;
  onTypeChange?: (type: SearchContentType) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  selectedType = 'all',
  onTypeChange,
  placeholder = 'Search tabs, sessions, workspaces (Ctrl+K)...',
  autoFocus = false,
}: SearchBarProps) {
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalVal !== value) {
        onChange(internalVal);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [internalVal, value, onChange]);

  const clear = () => {
    setInternalVal('');
    onChange('');
  };

  const types: Array<{ key: SearchContentType; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'open_tab', label: 'Open' },
    { key: 'session', label: 'Sessions' },
    { key: 'saved_tab', label: 'Saved' },
    { key: 'workspace', label: 'Workspaces' },
  ];

  return (
    <div className="space-y-2 w-full">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={internalVal}
          onChange={(e) => setInternalVal(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search"
          className="w-full pl-10 pr-9 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
        />
        {internalVal && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onTypeChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {types.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTypeChange(t.key)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedType === t.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
