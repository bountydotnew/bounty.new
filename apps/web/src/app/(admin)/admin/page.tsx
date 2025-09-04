"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Clock } from "lucide-react";
import Link from '@/components/ui/link';
import { AdminHeader } from "@/components/admin";
import { StatCard } from "@/components/admin/stat-card";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export default function AdminPage() {
  const { data: betaApps } = useQuery(
    trpc.betaApplications.getAll.queryOptions({ page: 1, limit: 1 }),
  );
  const { data: userStats } = useQuery(trpc.user.getUserStats.queryOptions());
  const { data: waitlist } = useQuery(
    trpc.earlyAccess.getAdminWaitlist.queryOptions({ page: 1, limit: 1 }),
  );

  const betaTotal = betaApps?.total ?? "–";
  const usersTotal = userStats?.data.platformStats.totalUsers ?? "–";
  const waitlistPending = waitlist ? waitlist.stats.pending : "–";
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Admin"
        description="Operational tools for managing access and users"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Beta Applications" value={betaTotal} hint="Total" icon={<FileText className="h-4 w-4" />} />
        <StatCard title="Users" value={usersTotal} hint="Total registered" icon={<Users className="h-4 w-4" />} />
        <StatCard title="Waitlist" value={waitlistPending} hint="Pending approvals" icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Beta Applications
            </CardTitle>
            <CardDescription>Review and manage beta access applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/beta-applications">
              <Button className="w-full">Open</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Open</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waitlist
            </CardTitle>
            <CardDescription>View and manage waitlist entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/waitlist">
              <Button className="w-full">Open</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
