"use client";

import type { ReactNode } from 'react';
import { MockBrowserProvider } from './mock-browser-context';
import { MockLoadingBar } from './mock-loading-bar';
import { MockPage } from './mock-page';
import { MockToolbar } from './mock-toolbar';

interface MockBrowserProps {
  /** Show macOS-style window dots (default: true) */
  headlights?: boolean;
  /** Make the browser draggable (default: false) - reserved for future use */
  draggable?: boolean;
  /** Initial URL to display */
  initialUrl: string;
  /** Browser content (Toolbar + Pages) */
  children: ReactNode;
  /** Optional fixed height (default: h-[500px] lg:h-[600px]) */
  className?: string;
  /** Compact mode for mobile (smaller fonts/sizes) */
  compact?: boolean;
}

function MockBrowserRoot({
  headlights = true,
  initialUrl,
  children,
  className,
  compact = false,
}: MockBrowserProps) {
  return (
    <MockBrowserProvider initialUrl={initialUrl} compact={compact}>
      <div className="relative group">
        {/* Outer glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl blur-sm opacity-60" />

        {/* Browser frame */}
        <div className="relative bg-[#0a0a0a] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden border border-[#1f1f1f]">
          {/* Title bar with headlights */}
          <div className={`bg-gradient-to-b from-[#1c1c1c] to-[#161616] flex items-center border-b border-[#1f1f1f] ${compact ? 'px-3 py-2' : 'px-4 py-2.5'}`}>
            {headlights && (
              <div className={`flex gap-2 ${compact ? 'gap-1.5' : ''}`}>
                <div className={`rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.4)] ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                <div className={`rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.4)] ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                <div className={`rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.4)] ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              </div>
            )}
          </div>

          {/* Browser content area */}
          <div className={className ?? 'h-[500px] lg:h-[600px]'}>
            <div className="relative h-full flex flex-col">
              <MockLoadingBar />
              {children}
            </div>
          </div>
        </div>
      </div>
    </MockBrowserProvider>
  );
}

// Attach sub-components as static properties
export const MockBrowser = Object.assign(MockBrowserRoot, {
  Toolbar: MockToolbar,
  Page: MockPage,
});
