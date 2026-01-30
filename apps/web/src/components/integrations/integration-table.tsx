'use client';

import type { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T) => ReactNode;
}

interface RowAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface IntegrationTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  rowActions?: RowAction<T>[];
  emptyMessage?: string;
}

export function IntegrationTable<T>({
  columns,
  data,
  keyExtractor,
  rowActions = [],
  emptyMessage = 'No items found.',
}: IntegrationTableProps<T>) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted py-4">{emptyMessage}</p>;
  }

  // Build grid template based on column widths + optional actions column
  const hasActions = rowActions.length > 0;
  const gridTemplate = columns
    .map((col) => col.width || '1fr')
    .concat(hasActions ? ['32px'] : [])
    .join(' ');

  return (
    <div className="rounded-lg border border-border-default overflow-hidden">
      {/* Header */}
      <div
        className="grid gap-4 px-4 py-3 text-sm text-text-muted"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {columns.map((col) => (
          <div key={col.key}>{col.header}</div>
        ))}
        {hasActions && <div />}
      </div>

      {/* Rows */}
      {data.map((item) => (
        <div
          key={keyExtractor(item)}
          className="grid gap-4 px-4 py-3 border-t border-border-default items-center text-sm"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((col) => (
            <div key={col.key}>{col.render(item)}</div>
          ))}
          {hasActions && (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 w-7 rounded text-text-muted hover:text-foreground transition-colors flex items-center justify-center"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-surface-1 border-border-default"
                >
                  {rowActions.map((action) => (
                    <DropdownMenuItem
                      key={action.label}
                      className={
                        action.variant === 'danger'
                          ? 'text-red-400 focus:text-red-400 focus:bg-surface-3'
                          : 'focus:bg-surface-3'
                      }
                      onClick={() => action.onClick(item)}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
