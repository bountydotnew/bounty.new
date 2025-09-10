'use client';

import type { AppRouter } from '@bounty/api';
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
import { trpc } from '@/utils/trpc';

export default function WaitlistPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    ...trpc.earlyAccess.getAdminWaitlist.queryOptions({
      page,
      limit: 20,
      search: search || undefined,
    }),
  });

  const updateAccessMutation = useMutation({
    ...trpc.earlyAccess.updateWaitlistAccess.mutationOptions(),
    onSuccess: () => {
      toast.success('Access updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['earlyAccess', 'getAdminWaitlist'],
      });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || 'Failed to update access');
    },
  });

  const inviteToBetaMutation = useMutation({
    ...trpc.earlyAccess.inviteToBeta.mutationOptions(),
   onMutate: async (vars: { id: string }) => {
     setUpdatingIds((prev) => new Set(prev).add(vars.id));
   },
    onSuccess: () => {
      toast.success('Beta invite sent');
      queryClient.invalidateQueries({
        queryKey: ['earlyAccess', 'getAdminWaitlist'],
      });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || 'Failed to invite to beta');
    },
   onSettled: (_data, _err, vars) => {
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

  if (error) {
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
            <div className="font-semibold text-xl text-neutral-100">{data?.stats.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl text-green-600">{data?.stats.withAccess || 0}</div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl text-orange-600">{data?.stats.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="text-sm text-neutral-300 font-medium">Waitlist Entries</CardTitle>
          <CardDescription className="text-xs text-neutral-500">Manage waitlist entries and grant/revoke access</CardDescription>
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
                {data?.entries.map((entry) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-neutral-800 bg-[#222222] p-3"
                    key={entry.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-neutral-200 text-sm">{entry.email}</span>
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
                        onClick={() => inviteToBetaMutation.mutate({ id: entry.id })}
                        size="sm"
                        variant="outline"
                      >
                        Beta Invite
                      </Button>
                    </div>
                  </div>
                ))}

                {data?.entries.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No waitlist entries found
                    </p>
                  </div>
                )}
              </div>
            )}

            {data && data.totalPages > 1 && (
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
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  disabled={page === data.totalPages}
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
