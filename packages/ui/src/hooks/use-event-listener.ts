'use client';

import { useEffect, useRef } from 'react';

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

/**
 * Declarative event listener hook. Subscribes on mount, cleans up on unmount.
 * The handler is always kept up-to-date via a ref, so it is safe to pass
 * inline arrow functions without causing re-subscriptions.
 *
 * Supports both standard DOM events (fully typed) and custom event names
 * (handler receives a generic `Event`).
 *
 * Replaces the pattern:
 * ```
 * useEffect(() => {
 *   window.addEventListener('resize', handler);
 *   return () => window.removeEventListener('resize', handler);
 * }, []);
 * ```
 */
export function useEventListener<K extends keyof EventMap>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element?: HTMLElement | Window | Document | null,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: HTMLElement | Window | Document | null,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: HTMLElement | Window | Document | null,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const target = element ?? window;
    if (!target?.addEventListener) return;

    const listener = (event: Event) => savedHandler.current(event);

    target.addEventListener(eventName, listener, options);
    return () => target.removeEventListener(eventName, listener, options);
    // We intentionally only re-subscribe when the target element or event name changes.
    // The handler is kept fresh via the ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, element]);
}
