import React, { useState } from 'react';
import { Globe, ExternalLink, Trash2 } from 'lucide-react';
import type { SavedTabSnapshot, TabRecord } from '../domain/types';
import { extractDomain } from '../lib/url-utils';

interface TabCardProps {
  item: SavedTabSnapshot | TabRecord;
  onOpen: (url: string) => void;
  onDelete?: (id: string) => void;
}

export function TabCard({ item, onOpen, onDelete }: TabCardProps) {
  const [imgError, setImgError] = useState(false);
  const domain = item.domain || extractDomain(item.url);

  return (
    <div className="flex flex-col justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {item.faviconUrl && !imgError ? (
            <img
              src={item.faviconUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-4 h-4 object-contain rounded-xs shrink-0"
            />
          ) : (
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-400 truncate">{domain}</span>
        </div>
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
          {item.title || 'Untitled'}
        </h4>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => onOpen(item.url)}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label="Delete saved tab"
            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
