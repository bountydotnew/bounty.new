'use client';

import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Search } from 'lucide-react';

type UserItem = { id: string; name: string; email: string };

interface UserSearchListProps {
  search: string;
  onSearchChange: (v: string) => void;
  users: UserItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClearSelection?: () => void;
}

export function UserSearchList({
  search,
  onSearchChange,
  users,
  isLoading,
  selectedIds,
  onToggle,
  onClearSelection,
}: UserSearchListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-neutral-500" />
        <Input
          className="max-w-sm border-neutral-800 bg-neutral-900"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users..."
          value={search}
        />
        {selectedIds.size > 0 && (
          <Button
            className="h-8 border-neutral-800 bg-surface-2 px-2 text-xs hover:bg-neutral-700/40"
            onClick={onClearSelection}
            variant="text"
          >
            Clear ({selectedIds.size})
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {isLoading ? (
          <div className="text-neutral-500 text-sm">Loading...</div>
        ) : users.length ? (
          users.map((u) => (
            <button
              className={`flex items-center justify-between rounded-md border p-3 text-left transition ${selectedIds.has(u.id) ? 'border-neutral-700 bg-neutral-800/60' : 'border-neutral-800 bg-surface-2 hover:bg-neutral-700/40'}`}
              key={u.id}
              onClick={() => onToggle(u.id)}
            >
              <div>
                <div className="font-medium text-neutral-200 text-sm">
                  {u.name}
                </div>
                <div className="text-neutral-400 text-xs">{u.email}</div>
              </div>
              <div
                className={`h-2 w-2 rounded-full ${selectedIds.has(u.id) ? 'bg-green-500' : 'bg-neutral-700'}`}
              />
            </button>
          ))
        ) : (
          <div className="text-neutral-500 text-sm">No users</div>
        )}
      </div>
    </div>
  );
}
