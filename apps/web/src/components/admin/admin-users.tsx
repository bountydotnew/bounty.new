'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Input } from '@bounty/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bounty/ui/components/select';
import { cn } from '@bounty/ui/lib/utils';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@bounty/ui/components/dialog';
import { Mail, Search, Plus, Ban, CheckCircle2, Send, Filter } from 'lucide-react';
import { useSession } from '@/context/session-context';
import { trpcClient } from '@/utils/trpc';
import Link from 'next/link';
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
  handle?: string | null;
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('')
  );
  const [userId, setUserId] = useQueryState('id', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [inviteFilter, setInviteFilter] = useQueryState(
    'invite',
    parseAsString.withDefault('all')
  );
  const [sortBy, setSortBy] = useQueryState(
    'sort',
    parseAsString.withDefault('newest')
  );
  const offset = (page - 1) * PAGE_SIZE;

  // Create invite dialog (manual email entry)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Send invite confirm dialog (pre-filled from user row)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmIsResend, setConfirmIsResend] = useState(false);

  // Invite all dialog
  const [inviteAllDialogOpen, setInviteAllDialogOpen] = useState(false);
  const [inviteAllResult, setInviteAllResult] = useState<{
    invited: number;
    failed: number;
    errors?: Array<{ email: string; error: string }>;
  } | null>(null);

  const banMutation = useMutation({
    mutationFn: (userId: string) =>
      trpcClient.user.adminBanUser.mutate({ userId, reason: 'Banned by admin' }),
    onSuccess: () => {
      toast.success('User banned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to ban user');
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) =>
      trpcClient.user.adminUnbanUser.mutate({ userId }),
    onSuccess: () => {
      toast.success('User unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to unban user');
    },
  });

  const inviteAllMutation = useMutation({
    mutationFn: (emails?: string[]) => trpcClient.earlyAccess.inviteAllUsers.mutate({ emails }),
    onSuccess: (data) => {
      setInviteAllResult({
        invited: data.invited,
        failed: data.failed,
        errors: ('errors' in data && data.errors) || undefined,
      });
      if (data.invited > 0) {
        toast.success(`Invited ${data.invited} user${data.invited === 1 ? '' : 's'}`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} invite${data.failed === 1 ? '' : 's'} failed`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitedEmails'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to invite users');
      setInviteAllDialogOpen(false);
    },
  });

  // Fetch list of emails that have been sent invites
  const { data: invitedEmailsData } = useQuery({
    queryKey: ['admin', 'invitedEmails'],
    queryFn: () => trpcClient.earlyAccess.getInvitedEmails.query(),
    staleTime: 60_000, // Cache for 1 minute
  });

  const invitedEmails = new Set(
    (invitedEmailsData?.emails ?? []).map((e) => e.toLowerCase())
  );

  // When filtering by invite status, we need to fetch all users since Better Auth
  // doesn't support filtering by inviteSentAt. Use a larger limit in this case.
  const isInviteFiltering = inviteFilter !== 'all';

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listUsers', search, userId, offset, inviteFilter],
    queryFn: async () => {
      // Build search params - ID takes priority over email search
      let searchParams = {};
      if (userId.trim()) {
        searchParams = {
          searchValue: userId.trim(),
          searchField: 'id' as const,
          searchOperator: 'eq' as const,
        };
      } else if (search.trim()) {
        searchParams = {
          searchValue: search.trim(),
          searchField: 'email' as const,
          searchOperator: 'contains' as const,
        };
      }

      const result = await authClient.admin.listUsers({
        query: {
          // Fetch all users when filtering by invite status (max 1000)
          limit: isInviteFiltering ? 1000 : PAGE_SIZE,
          offset: isInviteFiltering ? 0 : offset,
          ...searchParams,
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

  const allUsers = data?.users ?? [];

  // Filter and sort users (client-side)
  const users = allUsers
    .filter((u) => {
      if (inviteFilter === 'all') return true;

      const hasEarlyAccess = u.role === 'early_access' || u.role === 'admin';
      const hasBeenInvited = invitedEmails.has(u.email.toLowerCase());

      if (inviteFilter === 'early_access') return hasEarlyAccess;
      // Invited/Not invited only shows users without early access
      if (inviteFilter === 'invited') return !hasEarlyAccess && hasBeenInvited;
      if (inviteFilter === 'not_invited') return !hasEarlyAccess && !hasBeenInvited;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name ?? a.email).localeCompare(b.name ?? b.email);
        case 'name_desc':
          return (b.name ?? b.email).localeCompare(a.name ?? a.email);
        case 'email_asc':
          return a.email.localeCompare(b.email);
        case 'email_desc':
          return b.email.localeCompare(a.email);
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // When invite filtering, pagination is handled client-side
  const filteredTotal = users.length;
  const displayTotal = isInviteFiltering ? filteredTotal : (data?.total ?? 0);
  const totalPages = isInviteFiltering
    ? Math.ceil(filteredTotal / PAGE_SIZE)
    : Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  // For invite filtering, slice the users for the current page
  const displayUsers = isInviteFiltering
    ? users.slice(offset, offset + PAGE_SIZE)
    : users;

  const handleInviteAll = () => {
    setInviteAllResult(null);
    // If filtering, only invite the filtered users
    if (isInviteFiltering && users.length > 0) {
      const emails = users.map((u) => u.email);
      inviteAllMutation.mutate(emails);
    } else {
      inviteAllMutation.mutate(undefined);
    }
  };

  const handleInviteAllDialogClose = () => {
    setInviteAllDialogOpen(false);
    setInviteAllResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header + Create invite + Invite all */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage users and send invite codes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setInviteAllDialogOpen(true)}
            disabled={isInviteFiltering && users.length === 0}
          >
            <Send className="h-3.5 w-3.5" />
            {isInviteFiltering
              ? `Invite ${users.length} user${users.length === 1 ? '' : 's'}`
              : 'Invite all'}
          </Button>
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create invite
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <Input
            type="search"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setUserId(''); // Clear ID filter when searching by email
              setPage(1);
            }}
            placeholder="Search by email..."
            className="pl-9"
          />
        </div>
        <Select
          value={inviteFilter}
          onValueChange={(value) => {
            setInviteFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue>
              {inviteFilter === 'all' && 'All users'}
              {inviteFilter === 'invited' && 'Invited'}
              {inviteFilter === 'not_invited' && 'Not invited'}
              {inviteFilter === 'early_access' && 'Has early access'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="not_invited">Not invited</SelectItem>
            <SelectItem value="early_access">Has early access</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name_asc">Name A-Z</SelectItem>
            <SelectItem value="name_desc">Name Z-A</SelectItem>
            <SelectItem value="email_asc">Email A-Z</SelectItem>
            <SelectItem value="email_desc">Email Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show ID filter indicator */}
      {userId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Filtering by ID:</span>
          <code className="bg-surface-2 px-2 py-0.5 rounded text-xs">{userId}</code>
          <button
            type="button"
            onClick={() => setUserId('')}
            className="text-text-tertiary hover:text-foreground text-xs underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* User list */}
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">
            {inviteFilter !== 'all' ? (
              <>
                {filteredTotal} {filteredTotal === 1 ? 'user' : 'users'}
                <span className="text-text-tertiary ml-1">
                  ({inviteFilter === 'invited' ? 'invited' : inviteFilter === 'not_invited' ? 'not invited' : 'has early access'})
                </span>
              </>
            ) : (
              <>
                {displayTotal} {displayTotal === 1 ? 'user' : 'users'}
              </>
            )}
          </span>
          {inviteFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setInviteFilter('all')}
              className="text-xs text-text-tertiary hover:text-foreground flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Clear filter
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            Loading users...
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {displayUsers.map((u) => {
              const badge = roleBadge(u.role);
              const isCurrentUser = u.id === session?.user?.id;
              const isBanned = u.banned === true;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <Link
                    href={u.handle ? `/profile/${u.handle}` : `/profile/${u.id}`}
                    className="flex items-center gap-3 min-w-0 hover:opacity-80"
                  >
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
                        {isCurrentUser && (
                          <span className="text-[11px] text-text-tertiary bg-surface-2 px-1.5 py-0.5 rounded">
                            you
                          </span>
                        )}
                        {isBanned && (
                          <span className="text-[11px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            banned
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted truncate block">
                        {u.email}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>

                    {u.role === 'user' && !isBanned && (
                      (() => {
                        const hasBeenInvited = invitedEmails.has(u.email.toLowerCase());
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConfirmEmail(u.email);
                              setConfirmIsResend(hasBeenInvited);
                              setConfirmDialogOpen(true);
                            }}
                            title={hasBeenInvited ? `Resend invite to ${u.email}` : `Send invite to ${u.email}`}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {hasBeenInvited ? 'Resend Invite' : 'Invite'}
                          </Button>
                        );
                      })()
                    )}

                    {!isCurrentUser && u.role !== 'admin' && (
                      isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unbanMutation.mutate(u.id)}
                          disabled={unbanMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => banMutation.mutate(u.id)}
                          disabled={banMutation.isPending}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Ban
                        </Button>
                      )
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
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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
        isResend={confirmIsResend}
      />

      {/* Invite All Dialog */}
      <Dialog open={inviteAllDialogOpen} onOpenChange={handleInviteAllDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isInviteFiltering
                ? `Invite ${users.length} user${users.length === 1 ? '' : 's'}`
                : 'Invite all users'}
            </DialogTitle>
            <DialogDescription>
              {isInviteFiltering
                ? `Send invite codes to the ${users.length} users matching your current filter.`
                : 'Send invite codes to all users without early access.'}
            </DialogDescription>
          </DialogHeader>

          {inviteAllResult ? (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Invited {inviteAllResult.invited} user
                    {inviteAllResult.invited !== 1 ? 's' : ''}
                  </p>
                  {inviteAllResult.failed > 0 && (
                    <p className="text-xs text-text-muted">
                      {inviteAllResult.failed} failed
                    </p>
                  )}
                </div>
              </div>

              {inviteAllResult.errors && inviteAllResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground mb-2">
                    Failed invites:
                  </p>
                  <div className="max-h-32 overflow-y-auto text-xs">
                    {inviteAllResult.errors.map((err) => (
                      <div key={err.email} className="text-text-muted">
                        {err.email}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-6 pb-6 max-sm:pb-4">
              <p className="text-sm text-text-foreground">
                {isInviteFiltering ? (
                  <>
                    This will send invite codes to <span className="font-medium">{users.length}</span> users
                    {inviteFilter === 'not_invited' && ' who have not been invited yet'}.
                  </>
                ) : (
                  <>
                    This will send invite codes to all users with the{' '}
                    <span className="font-medium">User</span> role who don't have
                    early access yet.
                  </>
                )}
              </p>
            </div>
          )}

          <DialogFooter>
            {inviteAllResult ? (
              <DialogClose asChild>
                <Button variant="default">Done</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleInviteAll}
                  disabled={inviteAllMutation.isPending}
                >
                  {inviteAllMutation.isPending ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send invites
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
