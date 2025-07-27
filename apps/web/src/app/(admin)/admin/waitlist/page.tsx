"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Mail, Calendar, Users, CheckCircle, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";

export default function WaitlistPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
      toast.success("Access updated successfully");
      queryClient.invalidateQueries({ queryKey: ["earlyAccess", "getAdminWaitlist"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update access");
    },
  });

  const handleUpdateAccess = (id: string, hasAccess: boolean) => {
    updateAccessMutation.mutate({ id, hasAccess });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load waitlist data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <p className="text-muted-foreground">Manage waitlist entries and access permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.withAccess || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.stats.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading waitlist entries...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
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

                {data?.entries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No waitlist entries found</p>
                  </div>
                )}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
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