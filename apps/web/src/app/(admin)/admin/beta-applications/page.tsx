'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';
import {
  AdminHeader,
  BetaApplicationsTable,
  StatusFilter,
} from '@/components/admin';
import { Button } from '@bounty/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bounty/ui/components/select';
import { trpc } from '@/utils/trpc';

export default function BetaApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery(
    trpc.betaApplications.getAll.queryOptions({
      status:
        statusFilter === 'all' || statusFilter === ''
          ? undefined
          : (statusFilter as 'pending' | 'approved' | 'rejected'),
      page,
      limit: pageSize,
    })
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="-mx-4 sticky top-0 z-10 border-neutral-800 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <AdminHeader
          description="Review and manage beta access applications"
          title="Beta Applications"
        >
          <div className="flex items-center gap-2">
            <Button className="border-neutral-800" size="sm" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <StatusFilter
              onValueChange={setStatusFilter}
              value={statusFilter}
            />
            <Select
              onValueChange={(value) => handlePageSizeChange(Number(value))}
              value={pageSize.toString()}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AdminHeader>
      </div>

      <BetaApplicationsTable
        applications={data?.applications || []}
        isLoading={isLoading}
        total={total}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-neutral-800 border-t pt-2">
          <div className="text-muted-foreground text-sm">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    className="h-8 w-8 p-0"
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    size="sm"
                    variant={page === pageNum ? 'default' : 'outline'}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
