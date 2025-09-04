"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  Mail,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@bounty/api";

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
      toast.success("Access updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["earlyAccess", "getAdminWaitlist"],
      });
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || "Failed to update access");
    },
  });

  const handleUpdateAccess = (id: string, hasAccess: boolean) => {
    updateAccessMutation.mutate({ id, hasAccess });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.withAccess}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
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
                placeholder="Search by email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="max-w-sm bg-neutral-900 border-neutral-800"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Loading waitlist entries...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg border-neutral-800 bg-neutral-900/40"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.hasAccess ? (
                        <Badge variant="default" className="bg-green-600">
                          Has Access
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {entry.hasAccess ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateAccess(entry.id, false)}
                          disabled={updateAccessMutation.isPending}
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateAccess(entry.id, true)}
                          disabled={updateAccessMutation.isPending}
                        >
                          Grant Access
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {entries.length === 0 && (
                  <div className="text-center py-8">
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
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
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
                  onClick={() => onPageChange(page + 1)}
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
