'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from '@/components/ui/link';
import { trpc } from '@/utils/trpc';

export default function AdminPage() {
  const { data: betaApps } = useQuery(
    trpc.betaApplications.getAll.queryOptions({ page: 1, limit: 1 })
  );
  const { data: userStats } = useQuery(trpc.user.getUserStats.queryOptions());
  const { data: waitlist } = useQuery(
    trpc.earlyAccess.getAdminWaitlist.queryOptions({ page: 1, limit: 1 })
  );

  const betaTotal = betaApps?.total ?? '–';
  const usersTotal = userStats?.data.platformStats.totalUsers ?? '–';
  const waitlistPending = waitlist ? waitlist.stats.pending : '–';
  return (
    <div className="space-y-6">
      <AdminHeader
        description="Operational tools for managing access and users"
        title="Admin"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          hint="Total"
          icon={<FileText className="h-4 w-4" />}
          title="Beta Applications"
          value={betaTotal}
        />
        <StatCard
          hint="Total registered"
          icon={<Users className="h-4 w-4" />}
          title="Users"
          value={usersTotal}
        />
        <StatCard
          hint="Pending approvals"
          icon={<Clock className="h-4 w-4" />}
          title="Waitlist"
          value={waitlistPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Beta Applications
            </CardTitle>
            <CardDescription>
              Review and manage beta access applications
            </CardDescription>
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
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
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
