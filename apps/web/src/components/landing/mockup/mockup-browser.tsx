"use client";

import type { ReactNode } from 'react';

interface MockupBrowserProps {
  title?: string;
  children: ReactNode;
}

export function MockupBrowser({ title, children }: MockupBrowserProps) {
  return (
    <div className="bg-[#0E0E0E] rounded-xl shadow-2xl overflow-hidden border border-[#2a2a2a]">
      <div className="bg-[#191919] px-4 py-3 flex items-center gap-3 border-b border-[#2a2a2a]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
        </div>
        {title ? <span className="text-xs text-[#6C6C6C]">{title}</span> : null}
      </div>
      <div className="h-[500px] lg:h-[600px] overflow-hidden relative">{children}</div>
    </div>
  );
}
