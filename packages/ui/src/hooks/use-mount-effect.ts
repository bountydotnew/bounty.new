'use client';

import { useEffect } from 'react';

/**
 * Explicit wrapper for the one legitimate use of useEffect: synchronizing with
 * an external system exactly once on mount (and optionally cleaning up on unmount).
 *
 * Every other useEffect pattern has a better alternative:
 * - Derived state → compute inline
 * - Data fetching → useQuery / useMutation
 * - Responding to events → event handlers
 * - Resetting state on prop change → key prop
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
