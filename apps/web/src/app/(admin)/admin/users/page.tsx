'use client';

import type { AppRouter } from '@bounty/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import { Calendar, Crown, Mail, Search, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    ...trpc.user.getAllUsers.queryOptions({
      search: search || undefined,
      page,
      limit: 20,
    }),
  });

  const updateRoleMutation = useMutation({
    ...trpc.user.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user', 'getAllUsers'] });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  const users = useMemo(() => data?.users || [], [data?.users]);
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

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
                    </div>

                    <div className="flex items-center space-x-2">
                      {user.role === 'admin' ? (
                        <Button
                          disabled={updatingIds.has(user.id)}
                          onClick={() => handleRoleUpdate(user.id, 'user')}
                          size="sm"
                          variant="outline"
                        >
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          disabled={updatingIds.has(user.id)}
                          onClick={() => handleRoleUpdate(user.id, 'admin')}
                          size="sm"
                        >
                          Make Admin
                        </Button>
                      )}
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
