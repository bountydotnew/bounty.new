"use client";

type AutocompleteProps<T> = {
  open: boolean;
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  className?: string;
};

export function AutocompleteDropdown<T>({ open, items, getKey, renderItem, onSelect, className }: AutocompleteProps<T>) {
  if (!open || items.length === 0) return null;
  return (
    <div className={[
      "absolute left-0 right-0 top-full -mt-2 z-0 rounded-md border border-border bg-popover shadow-sm",
      className || "",
    ].join(" ")}
    >
      <div className="max-h-64 overflow-auto py-1">
        {items.map((item) => (
          <button
            key={getKey(item)}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none"
          >
            {renderItem(item)}
          </button>
        ))}
      </div>
    </div>
  );
}


