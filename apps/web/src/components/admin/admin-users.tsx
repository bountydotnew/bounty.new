'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Input } from '@bounty/ui/components/input';
import { cn } from '@bounty/ui/lib/utils';
import { Button } from '@bounty/ui/components/button';
import { Mail, Search, Plus } from 'lucide-react';
import { useSession } from '@/context/session-context';
import {
  CreateInviteDialog,
  SendInviteConfirmDialog,
} from './send-invite-dialog';

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  createdAt: Date | string;
}

const PAGE_SIZE = 25;

function roleBadge(role: string | null) {
  switch (role) {
    case 'admin':
      return {
        label: 'Admin',
        className: 'bg-amber-500/10 text-amber-500',
      };
    case 'early_access':
      return {
        label: 'Early Access',
        className: 'bg-green-500/10 text-green-500',
      };
    default:
      return {
        label: 'User',
        className: 'bg-surface-2 text-text-secondary',
      };
  }
}

export function AdminUsers() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);

  // Create invite dialog (manual email entry)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Send invite confirm dialog (pre-filled from user row)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listUsers', search, offset],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: PAGE_SIZE,
          offset,
          ...(search.trim()
            ? {
                searchValue: search.trim(),
                searchField: 'email' as const,
                searchOperator: 'contains' as const,
              }
            : {}),
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      });

      if (result.error) {
        toast.error('Failed to load users');
        return { users: [] as UserRow[], total: 0 };
      }

      return {
        users: (result.data?.users ?? []) as UserRow[],
        total: (result.data as any)?.total ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-8">
      {/* Header + Create invite */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage users and send invite codes.
          </p>
        </div>
        <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Create invite
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        <Input
          type="search"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          placeholder="Search by email..."
          className="pl-9"
        />
      </div>

      {/* User list */}
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle">
          <span className="text-sm font-medium text-text-secondary">
            {total} {total === 1 ? 'user' : 'users'}
          </span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {users.map((u) => {
              const badge = roleBadge(u.role);
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 rounded-full shrink-0">
                      {u.image && (
                        <AvatarImage alt={u.name ?? ''} src={u.image} />
                      )}
                      <AvatarFacehash name={u.name ?? u.email} size={32} />
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {u.name ?? u.email}
                        </span>
                        {u.id === session?.user?.id && (
                          <span className="text-[11px] text-text-tertiary bg-surface-2 px-1.5 py-0.5 rounded">
                            you
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted truncate block">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>

                    {u.role === 'user' && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmEmail(u.email);
                          setConfirmDialogOpen(true);
                        }}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-foreground hover:bg-surface-hover transition-colors"
                        title={`Send invite to ${u.email}`}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateInviteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <SendInviteConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        email={confirmEmail}
      />
    </div>
  );
}
