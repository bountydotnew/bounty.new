"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AdminHeader, WaitlistTable } from "@/components/admin";

export default function WaitlistPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    ...trpc.earlyAccess.getAdminWaitlist.queryOptions({
      page,
      limit: 20,
      search: search || undefined,
    }),
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load waitlist data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Waitlist Management"
        description="Manage waitlist entries and access permissions"
      />

      <WaitlistTable
        entries={data?.entries || []}
        stats={data?.stats || { total: 0, withAccess: 0, pending: 0 }}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
} 