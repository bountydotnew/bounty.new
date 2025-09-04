"use client";

import { useEffect, useState } from "react";

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
  if (!open) return null;
  return (
    <div
      className={[
        "absolute left-0 right-0 top-full z-30 mt-2 rounded-md border border-neutral-800 bg-neutral-900/90 backdrop-blur shadow transition-all duration-150 ease-out",
        entered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95",
        className || "",
      ].join(" ")}
    >
      <div className="max-h-64 overflow-auto py-1">
        {items.map((item) => (
          <button
            key={getKey(item)}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-3 py-2 text-neutral-300 hover:bg-neutral-800/40 focus:bg-neutral-800/40 focus:outline-none transition-all duration-150 border-b border-neutral-800/50 last:border-b-0 hover:translate-x-0.5"
          >
            {renderItem(item)}
          </button>
        ))}
        {loading && items.length === 0 && (
          <div className="px-3 py-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3 mb-1 last:mb-0">
                {renderSkeleton ? (
                  renderSkeleton()
                ) : (
                  <>
                    <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
                    <div className="h-3 w-24 bg-neutral-800 rounded" />
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
