'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of inactivity.
 *
 * Replaces the pattern:
 * ```
 * useEffect(() => {
 *   const timer = setTimeout(() => setDebouncedValue(value), delay);
 *   return () => clearTimeout(timer);
 * }, [value]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
