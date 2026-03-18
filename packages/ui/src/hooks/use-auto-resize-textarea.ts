'use client';

import { type RefObject, useCallback } from 'react';

/**
 * Returns a `resize` callback that auto-sizes a textarea to fit its content.
 * Call it from `onInput` / `onChange` or after programmatically setting content.
 *
 * Replaces the pattern:
 * ```
 * useEffect(() => {
 *   textarea.style.height = 'auto';
 *   textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, min), max)}px`;
 * });  // ← runs every render!
 * ```
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  {
    minHeight = 60,
    maxHeight = 600,
  }: { minHeight?: number; maxHeight?: number } = {}
) {
  const resize = useCallback(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${newHeight}px`;
  }, [ref, minHeight, maxHeight]);

  return resize;
}
