"use client";

import { ChevronLeft, ChevronRight, Lock, Loader2, X, RotateCw } from 'lucide-react';
import { useMockBrowser } from './mock-browser-context';

export function MockToolbar() {
  const { currentUrl, back, forward, canGoBack, canGoForward, isNavigating, compact } = useMockBrowser();

  return (
    <div className={`flex items-center bg-gradient-to-b from-[#141414] to-[#111111] border-b border-[#1f1f1f] ${compact ? 'gap-2 px-2 py-1.5' : 'gap-3 px-4 py-2.5'}`}>
      {/* Navigation buttons */}
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1'}`}>
        <button
          type="button"
          onClick={back}
          disabled={!canGoBack || isNavigating}
          className={`${compact ? 'p-1' : 'p-1.5'} rounded-md hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150`}
          aria-label="Go back"
        >
          <ChevronLeft className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#666]`} />
        </button>
        <button
          type="button"
          onClick={forward}
          disabled={!canGoForward || isNavigating}
          className={`${compact ? 'p-1' : 'p-1.5'} rounded-md hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150`}
          aria-label="Go forward"
        >
          <ChevronRight className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#666]`} />
        </button>
        <button
          type="button"
          className={`${compact ? 'p-1' : 'p-1.5'} rounded-md hover:bg-white/[0.06] transition-all duration-150 ${compact ? '' : 'ml-0.5'}`}
          aria-label={isNavigating ? 'Stop loading' : 'Refresh'}
        >
          {isNavigating ? (
            <X className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#666]`} />
          ) : (
            <RotateCw className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#666]`} />
          )}
        </button>
      </div>

      {/* URL bar */}
      <div className={`flex-1 flex items-center bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] shadow-inner ${compact ? 'gap-1.5 px-2 py-1' : 'gap-2.5 px-3.5 py-2'}`}>
        {isNavigating ? (
          <Loader2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#3b82f6] animate-spin shrink-0`} />
        ) : (
          <Lock className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#fff]/10 shrink-0`} />
        )}
        <span className={`${compact ? 'text-[11px]' : 'text-[13px]'} text-[#808080] truncate select-none font-medium tracking-tight`}>{currentUrl}</span>
      </div>
    </div>
  );
}
