'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { Input } from '@bounty/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bounty/ui/components/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Calendar,
  Check,
  Crown,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  User,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { ExternalInviteModal } from '@/components/admin/external-invite-modal';
import { trpc } from '@/utils/trpc';
import type {
  AccessStage,
  AdminListUsersResponse,
  AdminUser,
} from '@/types';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data,
    isLoading,
    error: usersError,
  } = useQuery<AdminListUsersResponse | null>({
    queryKey: ['admin', 'listUsers', search, page, pageSize],
    queryFn: async () => {
      // Get users from auth client (has all the auth-specific fields like banned)
      const { data: authData, error: authError } =
        await authClient.admin.listUsers({
          query: {
            searchValue: search || undefined,
            searchField: 'name',
            searchOperator: 'contains',
            limit: pageSize,
            offset: (page - 1) * pageSize,
            sortBy: 'name',
            sortDirection: 'desc',
          },
        });

      if (authError) {
        throw new Error(authError.message || 'Failed to load users');
      }

      // Just return auth data and handle accessStage in the component
      return authData ?? null;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'admin';
    }) => {
      const { error: setRoleError } = await authClient.admin.setRole({
        userId,
        role,
      });
      if (setRoleError) {
        throw new Error(setRoleError.message || 'Failed to update user role');
      }
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (updateError: unknown) => {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update user role'
      );
    },
  });

  // Get access stages separately using tRPC
  const { data: accessData } = useQuery({
    ...trpc.user.getAllUsers.queryOptions({
      search: search || undefined,
      page,
      limit: pageSize,
    }),
  });

  // Merge auth client users with access stage data
  const users = useMemo<
    (AdminUser & { role?: 'user' | 'admin'; accessStage: AccessStage })[]
  >(() => {
    const authUsers = data?.users ?? [];
    const accessStageMap = new Map<string, AccessStage>(
      (accessData?.users ?? []).map((entry) => {
        const stage = (entry.accessStage ?? 'none') as AccessStage;
        return [entry.id, stage];
      })
    );

    return authUsers.map((user) => ({
      ...user,
      role: user.role === 'admin' ? 'admin' : 'user',
      accessStage: accessStageMap.get(user.id) ?? 'none',
    }));
  }, [data?.users, accessData?.users]);
  const currentPageUsers = users.length;
  const adminCount = users.filter((user) => user.role === 'admin').length;
  const regularUserCount = currentPageUsers - adminCount;
  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [data?.total, pageSize]);

  const stats = useMemo(
    () => ({
      total: data?.total ?? 0,
      currentPage: currentPageUsers,
      admins: adminCount,
      regularUsers: regularUserCount,
    }),
    [data?.total, currentPageUsers, adminCount, regularUserCount]
  );

  const handleRoleUpdate = (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    updateRoleMutation.mutate(
      { userId, role: newRole },
      {
        onSettled: () => {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        },
      }
    );
  };

  const handleStopImpersonating = () => {
    authClient.admin
      .stopImpersonating({})
      .then(({ error: stopError }) => {
        if (stopError) {
          throw new Error(stopError.message || 'Failed to stop impersonating');
        }
        toast.success('Stopped impersonating');
      })
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : 'Failed to stop impersonating'
        )
      );
  };

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { error: createUserError } = await authClient.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        role: newUserRole,
        data: {},
      });
      if (createUserError) {
        throw new Error(createUserError.message || 'Failed to create user');
      }
    },
    onSuccess: () => {
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('user');
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (createError: unknown) => {
      toast.error(
        createError instanceof Error
          ? createError.message
          : 'Failed to create user'
      );
    },
  });

  const banUser = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    const reason = 'Spamming';
    const duration = 60 * 60 * 24 * 7;
    authClient.admin
      .banUser({ userId, banReason: reason, banExpiresIn: duration })
      .then(({ error: banError }) => {
        if (banError) {
          throw new Error(banError.message || 'Failed to ban user');
        }
        toast.success('User banned');
        queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : 'Failed to ban user')
      )
      .finally(() => {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  };

  // Handle invite user to access stage
  const inviteUserMutationOptions = trpc.user.inviteUser.mutationOptions({});

  const inviteUserMutation = useMutation({
    ...inviteUserMutationOptions,
    onSuccess(result, variables, context, mutation) {
      inviteUserMutationOptions.onSuccess?.(
        result,
        variables,
        context,
        mutation
      );
      const stageName =
        variables.accessStage === 'none'
          ? 'removed access'
          : `${variables.accessStage} access`;
      toast.success(`Updated user to ${stageName}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError(error, variables, context, mutation) {
      inviteUserMutationOptions.onError?.(
        error,
        variables,
        context,
        mutation
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    },
  });

  const handleInviteUser = (userId: string, accessStage: AccessStage) => {
    inviteUserMutation.mutate({ userId, accessStage });
  };

  const unbanUser = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    authClient.admin
      .unbanUser({ userId })
      .then(({ error: unbanError }) => {
        if (unbanError) {
          throw new Error(unbanError.message || 'Failed to unban user');
        }
        toast.success('User unbanned');
        queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : 'Failed to unban user')
      )
      .finally(() => {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  };

  const impersonateUser = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    authClient.admin
      .impersonateUser({ userId })
      .then(({ error: impersonateError }) => {
        if (impersonateError) {
          throw new Error(
            impersonateError.message || 'Failed to impersonate user'
          );
        }
        toast.success('Impersonation started');
      })
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : 'Failed to impersonate user'
        )
      )
      .finally(() => {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  };

  const revokeUserSessions = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    authClient.admin
      .revokeUserSessions({ userId })
      .then(({ error: revokeError }) => {
        if (revokeError) {
          throw new Error(revokeError.message || 'Failed to revoke sessions');
        }
        toast.success('Sessions revoked');
      })
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : 'Failed to revoke sessions'
        )
      )
      .finally(() => {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  };

  const deleteUser = (userId: string) => {
    if (!confirm('Delete user?')) {
      return;
    }
    setUpdatingIds((prev) => new Set(prev).add(userId));
    authClient.admin
      .removeUser({ userId })
      .then(({ error: deleteError }) => {
        if (deleteError) {
          throw new Error(deleteError.message || 'Failed to delete user');
        }
        toast.success('User deleted');
        queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : 'Failed to delete user')
      )
      .finally(() => {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  };

  if (usersError) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">Failed to load users data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Manage user roles and permissions"
        title="User Management"
      />

      <div className="flex justify-end space-x-2">
        <ExternalInviteModal />
        <Button onClick={handleStopImpersonating} size="sm" variant="outline">
          Stop Impersonating
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-neutral-100 text-xl">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Current Page</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-neutral-100 text-xl">
              {stats.currentPage}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl text-yellow-600">
              {stats.admins}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Regular Users</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-blue-600 text-xl">
              {stats.regularUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Users
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-5">
              <Input
                className="border-neutral-800 bg-neutral-900"
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name"
                value={newUserName}
              />
              <Input
                className="border-neutral-800 bg-neutral-900"
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Email"
                type="email"
                value={newUserEmail}
              />
              <Input
                className="border-neutral-800 bg-neutral-900"
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Password"
                type="password"
                value={newUserPassword}
              />
              <Select
                onValueChange={(v) => setNewUserRole(v as 'user' | 'admin')}
                value={newUserRole}
              >
                <SelectTrigger className="border-neutral-800 bg-neutral-900">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                disabled={!(newUserEmail && newUserPassword && newUserName)}
                onClick={() => createUserMutation.mutate()}
                size="sm"
              >
                Create
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="max-w-sm border-neutral-800 bg-neutral-900"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                value={search}
              />
            </div>

            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-neutral-800 bg-[#222222] p-3"
                    key={user.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-neutral-200 text-sm">
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-neutral-400 text-sm">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-neutral-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.role === 'admin' ? (
                        <Badge className="bg-yellow-600" variant="default">
                          <Crown className="mr-1 h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <User className="mr-1 h-3 w-3" />
                          User
                        </Badge>
                      )}
                      {user.banned ? (
                        <Badge className="bg-red-600" variant="default">
                          Banned
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="h-7 rounded-lg border border-neutral-700 bg-[#222222] p-1 text-neutral-300 hover:bg-neutral-700/40"
                            disabled={updatingIds.has(user.id)}
                            size="icon"
                            variant="outline"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuSub>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/users/${user.id}`)
                              }
                            >
                              <User className="mr-2 h-4 w-4" />
                              View User&apos;s Profile
                            </DropdownMenuItem>
                            <DropdownMenuSubTrigger>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Access Stage
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                disabled={user.accessStage === 'alpha'}
                                onClick={() =>
                                  handleInviteUser(user.id, 'alpha')
                                }
                              >
                                <span className="mr-2">α</span>
                                Alpha Access
                                {user.accessStage === 'alpha' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={user.accessStage === 'beta'}
                                onClick={() =>
                                  handleInviteUser(user.id, 'beta')
                                }
                              >
                                <span className="mr-2">β</span>
                                Beta Access
                                {user.accessStage === 'beta' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={user.accessStage === 'production'}
                                onClick={() =>
                                  handleInviteUser(user.id, 'production')
                                }
                              >
                                <span className="mr-2">🚀</span>
                                Production Access
                                {user.accessStage === 'production' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-400"
                                disabled={user.accessStage === 'none'}
                                onClick={() =>
                                  handleInviteUser(user.id, 'none')
                                }
                              >
                                <X className="mr-2 h-4 w-4" />
                                Remove Access
                                {user.accessStage === 'none' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="mr-2 h-4 w-4" />
                              Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                disabled={user.role === 'admin'}
                                onClick={() =>
                                  handleRoleUpdate(user.id, 'admin')
                                }
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                Make Admin
                                {user.role === 'admin' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={user.role === 'user'}
                                onClick={() =>
                                  handleRoleUpdate(user.id, 'user')
                                }
                              >
                                <User className="mr-2 h-4 w-4" />
                                Regular User
                                {user.role === 'user' && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />

                          {/* Admin Actions */}
                          <DropdownMenuItem
                            onClick={() => impersonateUser(user.id)}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            Impersonate
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => revokeUserSessions(user.id)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Revoke Sessions
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Destructive Actions */}
                          {user.banned ? (
                            <DropdownMenuItem
                              className="text-green-400 focus:text-green-400"
                              onClick={() => unbanUser(user.id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => banUser(user.id)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400"
                            onClick={() => deleteUser(user.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 border-neutral-800 border-t pt-4">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
