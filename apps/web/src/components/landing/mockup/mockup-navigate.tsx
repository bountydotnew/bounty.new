"use client";

import type { ReactNode } from 'react';
import { MockupTransition } from './mockup-transition';

interface MockupNavigateProps {
  route: string;
  header?: ReactNode;
  children: ReactNode;
}

export function MockupNavigate({ route, header, children }: MockupNavigateProps) {
  return (
    <MockupTransition transitionKey={route}>
      <div className="absolute inset-0 bg-[#0E0E0E]">
        {header ? <div className="sticky top-0 z-10">{header}</div> : null}
        <div className="h-full overflow-auto">{children}</div>
      </div>
    </MockupTransition>
  );
}
