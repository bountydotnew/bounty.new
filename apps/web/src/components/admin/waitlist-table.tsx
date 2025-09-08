'use client';

import type { AppRouter } from '@bounty/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import {
  Calendar,
  CheckCircle,
  Mail,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
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

type WaitlistEntry = {
  id: string;
  email: string;
  hasAccess: boolean;
  createdAt: string;
};

interface WaitlistTableProps {
  entries: WaitlistEntry[];
  stats: {
    total: number;
    withAccess: number;
    pending: number;
  };
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function WaitlistTable({
  entries,
  stats,
  isLoading,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: WaitlistTableProps) {
  const queryClient = useQueryClient();

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

  const handleUpdateAccess = (id: string, hasAccess: boolean) => {
    updateAccessMutation.mutate({ id, hasAccess });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {stats.withAccess}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-orange-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
          <CardDescription>
            Manage waitlist entries and grant/revoke access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="max-w-sm border-neutral-800 bg-neutral-900"
                onChange={(e) => onSearchChange(e.target.value)}
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
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-4"
                    key={entry.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">
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
                          disabled={updateAccessMutation.isPending}
                          onClick={() => handleUpdateAccess(entry.id, false)}
                          size="sm"
                          variant="outline"
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          disabled={updateAccessMutation.isPending}
                          onClick={() => handleUpdateAccess(entry.id, true)}
                          size="sm"
                        >
                          Grant Access
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {entries.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No waitlist entries found
                    </p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
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
                  onClick={() => onPageChange(page + 1)}
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
