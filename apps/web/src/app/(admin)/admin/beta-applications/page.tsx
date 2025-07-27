"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AdminHeader, StatusFilter, BetaApplicationsTable } from "@/components/admin";

export default function BetaApplicationsPage() {
    const [statusFilter, setStatusFilter] = useState<string>("");

    const { data, isLoading } = useQuery(
        trpc.betaApplications.getAll.queryOptions({
            status: statusFilter === "all" || statusFilter === "" ? undefined : (statusFilter as "pending" | "approved" | "rejected"),
            page: 1,
            limit: 50,
        })
    );

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Beta Applications"
                description="Review and manage beta access applications"
            >
                <StatusFilter value={statusFilter} onValueChange={setStatusFilter} />
            </AdminHeader>

            <BetaApplicationsTable
                applications={data?.applications || []}
                total={data?.total || 0}
                isLoading={isLoading}
            />
        </div>
    );
} 