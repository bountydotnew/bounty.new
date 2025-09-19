'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
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
    <Card className="border border-neutral-800 bg-[#222222]">
      <CardHeader>
        <CardTitle className="font-medium text-neutral-300 text-sm">
          Applications ({total})
        </CardTitle>
        <CardDescription className="text-neutral-500 text-xs">
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
          <div className="space-y-2">
            {applications.map((app) => (
              <BetaApplicationCard application={app} key={app.id} />
            ))}

            {applications.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-neutral-500 text-sm">
                  No applications found
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
