import React from 'react';

interface LoadingStateProps {
  rows?: number;
  message?: string;
}

export function LoadingState({ rows = 4, message = 'Loading...' }: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" className="space-y-3 py-4 w-full">
      <span className="sr-only">{message}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-full"
        />
      ))}
    </div>
  );
}
