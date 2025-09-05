'use client';

import { authClient } from '@bounty/auth/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Crown,
  Mail,
  MoreHorizontal,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
 

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [_updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'listUsers', search, page, pageSize],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
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
      if (error) {
        throw new Error(error.message || 'Failed to load users');
      }
      return data;
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
      const { error } = await authClient.admin.setRole({ userId, role });
      if (error) {
        throw new Error(error.message || 'Failed to update user role');
      }
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user role'
      );
    },
  });

  const users = useMemo(() => data?.users || [], [data?.users]);
  const total = data?.total || 0;
  const totalPages = useMemo(() => {
    const limit = (data as any)?.limit || pageSize;
    return Math.max(1, Math.ceil((total || 0) / (limit || pageSize)));
  }, [data, pageSize, total]);

  const stats = useMemo(() => {
    const currentPageUsers = users.length;
    const adminCount = users.filter((user) => user.role === 'admin').length;
    const regularUserCount = currentPageUsers - adminCount;

    return {
      total,
      currentPage: currentPageUsers,
      admins: adminCount,
      regularUsers: regularUserCount,
    };
  }, [users, total]);

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
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to stop impersonating');
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
      const { error } = await authClient.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        role: newUserRole,
        data: {},
      });
      if (error) {
        throw new Error(error.message || 'Failed to create user');
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
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    },
  });

  const banUser = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    const reason = 'Spamming';
    const duration = 60 * 60 * 24 * 7;
    authClient.admin
      .banUser({ userId, banReason: reason, banExpiresIn: duration })
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to ban user');
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

  const unbanUser = (userId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(userId));
    authClient.admin
      .unbanUser({ userId })
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to unban user');
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
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to impersonate user');
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
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to revoke sessions');
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
      .then(({ error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to delete user');
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

  if (error) {
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

      <div className="flex justify-end">
        <Button onClick={handleStopImpersonating} size="sm" variant="outline">
          Stop Impersonating
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
            <p className="text-muted-foreground text-xs">Across all pages</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Current Page</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.currentPage}</div>
            <p className="text-muted-foreground text-xs">Users on this page</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-yellow-600">
              {stats.admins}
            </div>
            <p className="text-muted-foreground text-xs">On this page</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Regular Users</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-600">
              {stats.regularUsers}
            </div>
            <p className="text-muted-foreground text-xs">On this page</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setNewUserRole('user')}
                  size="sm"
                  variant={newUserRole === 'user' ? 'default' : 'outline'}
                >
                  User
                </Button>
                <Button
                  onClick={() => setNewUserRole('admin')}
                  size="sm"
                  variant={newUserRole === 'admin' ? 'default' : 'outline'}
                >
                  Admin
                </Button>
                <Button
                  disabled={!(newUserEmail && newUserPassword && newUserName)}
                  onClick={() => createUserMutation.mutate()}
                  size="sm"
                >
                  Create
                </Button>
              </div>
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
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-4"
                    key={user.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">
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
                            size="icon"
                            variant="outline"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-10 w-44 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
                          {user.role === 'admin' ? (
                            <DropdownMenuItem
                              className="text-neutral-200 hover:bg-neutral-800"
                              onClick={() => handleRoleUpdate(user.id, 'user')}
                            >
                              Remove Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-neutral-200 hover:bg-neutral-800"
                              onClick={() => handleRoleUpdate(user.id, 'admin')}
                            >
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {user.banned ? (
                            <DropdownMenuItem
                              className="text-neutral-200 hover:bg-neutral-800"
                              onClick={() => unbanUser(user.id)}
                            >
                              Unban
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-neutral-200 hover:bg-neutral-800"
                              onClick={() => banUser(user.id)}
                            >
                              Ban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-neutral-200 hover:bg-neutral-800"
                            onClick={() => revokeUserSessions(user.id)}
                          >
                            Revoke Sessions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-neutral-200 hover:bg-neutral-800"
                            onClick={() => impersonateUser(user.id)}
                          >
                            Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-950/40"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
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
