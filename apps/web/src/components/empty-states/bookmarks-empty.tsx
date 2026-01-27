'use client';

import Link from 'next/link';

/**
 * Empty state for the bookmarks page
 * Minimal, on-brand design matching bounty.new's aesthetic
 */
export function BookmarksEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      {/* Illustration container */}
      <div className="relative mb-8">
        {/* Subtle glow */}
        <div className="absolute inset-0 blur-2xl bg-white/[0.02] rounded-full scale-150" />

        {/* Main bookmark icon */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-24 h-24 rounded-2xl border border-dashed border-[#333] flex items-center justify-center bg-[#111]/50">
            {/* Bookmark shape */}
            <svg
              width="36"
              height="44"
              viewBox="0 0 36 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6C4 3.79086 5.79086 2 8 2H28C30.2091 2 32 3.79086 32 6V40L18 32L4 40V6Z"
                stroke="#444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Small plus icon inside bookmark */}
              <path
                d="M18 14V22M14 18H22"
                stroke="#555"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="text-center max-w-xs">
        <h3 className="text-[15px] font-medium text-[#ccc] mb-2">
          No bookmarks yet
        </h3>
        <p className="text-[13px] text-[#666] leading-relaxed mb-6">
          Save bounties you're interested in by clicking the bookmark icon.
          They'll appear here for quick access.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] text-[#888] hover:text-white rounded-lg border border-[#333] hover:border-[#444] bg-[#1a1a1a] hover:bg-[#222] transition-all duration-200"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path d="M8 1a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 018 1z" />
          </svg>
          Browse bounties
        </Link>
      </div>
    </div>
  );
}
