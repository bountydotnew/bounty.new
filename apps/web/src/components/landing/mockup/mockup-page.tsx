"use client";

import type { ReactNode } from 'react';

interface MockupPageProps {
  header?: ReactNode;
  content: ReactNode;
}

export function MockupPage({ header, content }: MockupPageProps) {
  return (
    <div className="absolute inset-0 bg-[#0E0E0E]">
      {header ? <div className="sticky top-0 z-10">{header}</div> : null}
      <div className="h-full overflow-auto">{content}</div>
    </div>
  );
}
