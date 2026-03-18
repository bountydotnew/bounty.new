'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

const serverSnapshot = {
  width: undefined as number | undefined,
  height: undefined as number | undefined,
};

function getSnapshot() {
  return { width: window.innerWidth, height: window.innerHeight };
}

// useSyncExternalStore needs referential equality for snapshot, so memoize
let cachedSnapshot = serverSnapshot;
function getMemoizedSnapshot() {
  const next = getSnapshot();
  if (
    cachedSnapshot.width === next.width &&
    cachedSnapshot.height === next.height
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return cachedSnapshot;
}

export function useWindowSize() {
  return useSyncExternalStore(
    subscribe,
    getMemoizedSnapshot,
    () => serverSnapshot
  );
}
