"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, User, Mail, Calendar, Crown, Users } from "lucide-react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@bounty/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { AdminHeader } from "@/components/admin";

export default function UsersPage() {
  const [search, setSearch] = useState("");
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
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user", "getAllUsers"] });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const users = useMemo(() => data?.users || [], [data?.users]);
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const stats = useMemo(() => {
    const currentPageUsers = users.length;
    const adminCount = users.filter((user) => user.role === "admin").length;
    const regularUserCount = currentPageUsers - adminCount;

    return {
      total: total,
      currentPage: currentPageUsers,
      admins: adminCount,
      regularUsers: regularUserCount,
    };
  }, [users, total]);

  const handleRoleUpdate = (userId: string, newRole: "user" | "admin") => {
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
      },
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load users data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="User Management"
        description="Manage user roles and permissions"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across all pages</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentPage}</div>
            <p className="text-xs text-muted-foreground">Users on this page</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">On this page</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.regularUsers}
            </div>
            <p className="text-xs text-muted-foreground">On this page</p>
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
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm bg-neutral-900 border-neutral-800"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg border-neutral-800 bg-neutral-900/40"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.role === "admin" ? (
                        <Badge variant="default" className="bg-yellow-600">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <User className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {user.role === "admin" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, "user")}
                          disabled={updatingIds.has(user.id)}
                        >
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, "admin")}
                          disabled={updatingIds.has(user.id)}
                        >
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 border-t border-neutral-800 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
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
