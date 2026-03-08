'use client';

import { useFeedback } from './context';
import type { ReactNode } from 'react';

type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const POSITION_CLASSES: Record<Position, string> = {
  'bottom-right': 'fixed bottom-5 right-5',
  'bottom-left': 'fixed bottom-5 left-5',
  'top-right': 'fixed top-5 right-5',
  'top-left': 'fixed top-5 left-5',
};

const DEFAULT_LABEL = 'Feedback';

export function FeedbackButton({
  position = 'bottom-right',
  label,
  className,
  children,
}: {
  position?: Position;
  label?: string;
  /** Additional CSS classes. These are merged with the position classes, not a full override. */
  className?: string;
  children?: ReactNode;
}) {
  const { open, isOpen } = useFeedback();

  if (isOpen) return null;

  const resolvedLabel = label ?? DEFAULT_LABEL;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={resolvedLabel}
      className={`${POSITION_CLASSES[position]} z-[9999] flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 shadow-lg transition-all hover:bg-neutral-800 hover:text-white hover:border-neutral-600 active:scale-95${className ? ` ${className}` : ''}`}
    >
      {children ?? (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          {resolvedLabel}
        </>
      )}
    </button>
  );
}
