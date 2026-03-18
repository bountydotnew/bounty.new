'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Simple countdown hook. Decrements every second while value > 0.
 * Returns [current, start] where `start(seconds)` kicks off a new countdown.
 *
 * Replaces the pattern:
 * ```
 * useEffect(() => {
 *   if (cooldown > 0) {
 *     const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
 *     return () => clearTimeout(timer);
 *   }
 * }, [cooldown]);
 * ```
 */
export function useCountdown(
  initialValue = 0
): [number, (seconds: number) => void] {
  const [remaining, setRemaining] = useState(initialValue);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (remaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [remaining]);

  const start = (seconds: number) => setRemaining(seconds);

  return [remaining, start];
}
