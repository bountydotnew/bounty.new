'use client';

import { useEffect, useRef } from 'react';

export interface TimelineStep<T> {
  delay: number;
  action: T;
}

/**
 * Runs a sequence of timed actions on mount. Cleans up all timers on unmount.
 *
 * Replaces the pattern:
 * ```
 * useEffect(() => {
 *   const timers = timeline.map(({ delay, action }) =>
 *     setTimeout(() => dispatch(action), delay)
 *   );
 *   return () => timers.forEach(clearTimeout);
 * }, []);
 * ```
 */
export function useAnimationTimeline<T>(
  timeline: TimelineStep<T>[],
  dispatch: (action: T) => void,
  deps: React.DependencyList = []
) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timers = timeline.map(({ delay, action }) =>
      setTimeout(() => dispatchRef.current(action), delay)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
