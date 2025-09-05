'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BetaApplication } from '@/types/beta-application';
import { BetaApplicationCard } from './beta-application-card';

interface BetaApplicationsTableProps {
  applications: BetaApplication[];
  total: number;
  isLoading: boolean;
}

export function BetaApplicationsTable({
  applications,
  total,
  isLoading,
}: BetaApplicationsTableProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle>Applications ({total})</CardTitle>
        <CardDescription>
          Review applications and grant beta access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-6">
            <div className="h-6 w-40 animate-pulse rounded bg-neutral-800" />
            <div className="h-24 w-full animate-pulse rounded bg-neutral-800" />
            <div className="h-24 w-full animate-pulse rounded bg-neutral-800" />
            <div className="h-24 w-full animate-pulse rounded bg-neutral-800" />
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <BetaApplicationCard application={app} key={app.id} />
            ))}

            {applications.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No applications found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
