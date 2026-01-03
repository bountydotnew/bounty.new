'use client';

import type { AppRouter } from '@bounty/api';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import {
  Calendar,
  CheckCircle,
  Mail,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { trpcClient } from '@/utils/trpc';

export default function WaitlistPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['earlyAccess', 'getAdminWaitlist', page, search],
    queryFn: async () => {
      const result = await (
        trpcClient.earlyAccess.getAdminWaitlist as {
          query: (input: {
            page: number;
            limit: number;
            search?: string;
          }) => Promise<{
            entries: Array<{
              id: string;
              email: string;
              hasAccess: boolean;
              createdAt: Date | string;
              [key: string]: unknown;
            }>;
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            stats: { total: number; withAccess: number; pending: number };
          }>;
        }
      ).query({
        page,
        limit: 20,
        search: search || undefined,
      });
      return result;
    },
  });

  const waitlistStats = {
    total: Number(data?.stats.total ?? 0),
    withAccess: Number(data?.stats.withAccess ?? 0),
    pending: Number(data?.stats.pending ?? 0),
  };
  const waitlistEntries = data?.entries ?? [];
  const totalPages = Number(data?.totalPages ?? 1);

  const updateAccessMutation = useMutation({
    mutationFn: async (input: { id: string; hasAccess: boolean }) => {
      const result = await (
        trpcClient.earlyAccess.updateWaitlistAccess as {
          mutate: (input: {
            id: string;
            hasAccess: boolean;
          }) => Promise<{ success: boolean }>;
        }
      ).mutate(input);
      return result;
    },
    onSuccess: () => {
      toast.success('Access updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['earlyAccess', 'getAdminWaitlist'],
      });
    },
    onError: (mutationError: unknown) => {
      const error = mutationError as TRPCClientErrorLike<AppRouter>;
      toast.error(error.message || 'Failed to update access');
    },
  });

  const inviteToBetaMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      const result = await (
        trpcClient.earlyAccess.inviteToBeta as {
          mutate: (input: { id: string }) => Promise<{ success: boolean }>;
        }
      ).mutate(input);
      return result;
    },
    onMutate: (vars: { id: string }) => {
      setUpdatingIds((prev) => new Set(prev).add(vars.id));
    },
    onSuccess: () => {
      toast.success('Beta invite sent');
      queryClient.invalidateQueries({
        queryKey: ['earlyAccess', 'getAdminWaitlist'],
      });
    },
    onError: (mutationError: unknown) => {
      const error = mutationError as TRPCClientErrorLike<AppRouter>;
      toast.error(error.message || 'Failed to invite to beta');
    },
    onSettled: (_data: unknown, _err: unknown, vars: { id: string }) => {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
    },
  });

  const handleUpdateAccess = (id: string, hasAccess: boolean) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    updateAccessMutation.mutate(
      { id, hasAccess },
      {
        onSettled: () => {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      }
    );
  };

  if (queryError) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">Failed to load waitlist data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Manage waitlist entries and access permissions"
        title="Waitlist Management"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-neutral-100 text-xl">
              {waitlistStats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-green-600 text-xl">
              {waitlistStats.withAccess}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-orange-600 text-xl">
              {waitlistStats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Waitlist Entries
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Manage waitlist entries and grant/revoke access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="max-w-sm border-neutral-800 bg-neutral-900"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                value={search}
              />
            </div>

            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Loading waitlist entries...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {waitlistEntries.map(
                  (entry: {
                    id: string;
                    email: string;
                    hasAccess: boolean;
                    createdAt: Date | string;
                    [key: string]: unknown;
                  }) => (
                    <div
                      className="flex items-center justify-between rounded-md border border-neutral-800 bg-[#222222] p-3"
                      key={entry.id}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-neutral-200 text-sm">
                            {entry.email}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-neutral-400 text-sm">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.hasAccess ? (
                          <Badge className="bg-green-600" variant="default">
                            Has Access
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {entry.hasAccess ? (
                          <Button
                            disabled={updatingIds.has(entry.id)}
                            onClick={() => handleUpdateAccess(entry.id, false)}
                            size="sm"
                            variant="outline"
                          >
                            Revoke Access
                          </Button>
                        ) : (
                          <Button
                            disabled={updatingIds.has(entry.id)}
                            onClick={() => handleUpdateAccess(entry.id, true)}
                            size="sm"
                          >
                            Grant Access
                          </Button>
                        )}
                        <Button
                          disabled={updatingIds.has(entry.id)}
                          onClick={() =>
                            inviteToBetaMutation.mutate({ id: entry.id })
                          }
                          size="sm"
                          variant="outline"
                        >
                          Beta Invite
                        </Button>
                      </div>
                    </div>
                  )
                )}

                {waitlistEntries.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No waitlist entries found
                    </p>
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
