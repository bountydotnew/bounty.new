"use client";

import type { ReactNode } from 'react';

interface MockupBrowserProps {
  title?: string;
  children: ReactNode;
}

export function MockupBrowser({ title, children }: MockupBrowserProps) {
  return (
    <div className="bg-background rounded-xl shadow-2xl overflow-hidden border border-border-default">
      <div className="bg-surface-1 px-4 py-3 flex items-center gap-3 border-b border-border-default">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-surface-hover" />
          <div className="w-3 h-3 rounded-full bg-surface-hover" />
          <div className="w-3 h-3 rounded-full bg-surface-hover" />
        </div>
        {title ? <span className="text-xs text-text-muted">{title}</span> : null}
      </div>
      <div className="h-[500px] lg:h-[600px] overflow-hidden relative">{children}</div>
    </div>
  );
}
