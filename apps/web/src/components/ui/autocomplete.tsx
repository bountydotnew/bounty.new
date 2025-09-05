'use client';

import { useEffect, useState } from 'react';

type AutocompleteProps<T> = {
  open: boolean;
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
  renderSkeleton?: () => React.ReactNode;
};

export function AutocompleteDropdown<T>({
  open,
  items,
  getKey,
  renderItem,
  onSelect,
  className,
  loading = false,
  skeletonCount = 4,
  renderSkeleton,
}: AutocompleteProps<T>) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!open) {
    return null;
  }
  return (
    <div
      className={[
        'absolute top-full right-0 left-0 z-30 mt-2 rounded-md border border-neutral-800 bg-neutral-900/90 shadow backdrop-blur transition-all duration-150 ease-out',
        entered
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-1 scale-95 opacity-0',
        className || '',
      ].join(' ')}
    >
      <div className="max-h-64 overflow-auto py-1">
        {items.map((item) => (
          <button
            className="w-full border-neutral-800/50 border-b px-3 py-2 text-left text-neutral-300 transition-all duration-150 last:border-b-0 hover:translate-x-0.5 hover:bg-neutral-800/40 focus:bg-neutral-800/40 focus:outline-none"
            key={getKey(item)}
            onClick={() => onSelect(item)}
            type="button"
          >
            {renderItem(item)}
          </button>
        ))}
        {loading && items.length === 0 && (
          <div className="px-3 py-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                className="mb-1 animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3 last:mb-0"
                key={i}
              >
                {renderSkeleton ? (
                  renderSkeleton()
                ) : (
                  <>
                    <div className="mb-2 h-4 w-40 rounded bg-neutral-800" />
                    <div className="h-3 w-24 rounded bg-neutral-800" />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
