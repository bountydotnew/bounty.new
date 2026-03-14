'use client';

import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@bounty/ui/components/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@bounty/ui/components/table';
import { formatAmount } from '@bounty/ui/lib/utils';

const statusDot: Record<string, string> = {
  completed: 'bg-emerald-500',
  processing: 'bg-blue-500',
  pending: 'bg-muted-foreground/64',
  failed: 'bg-red-500',
  active: 'bg-blue-500',
};

const statusLabel: Record<string, string> = {
  completed: 'Completed',
  processing: 'Processing',
  pending: 'Pending',
  failed: 'Failed',
  active: 'Active',
};

export function PaymentActivity() {
  const data = useQuery(api.functions.connect.getActivity, {
    page: 1,
    limit: 20,
  });

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activities = data?.data ?? [];

  const totalReceived = activities
    .filter((a: any) => a.type === 'payout' && a.status === 'completed')
    .reduce((sum: number, a: any) => sum + Number.parseFloat(a.amount), 0);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-lg">
        <Clock className="size-12 text-muted-foreground/50 mb-4" />
        <p className="text-base font-semibold mb-2">No activity yet</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your payout activity and created bounties will appear here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Recent bounty activity.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Bounty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity: any) => {
          const status =
            activity.type === 'payout' ? activity.status : 'active';
          return (
            <TableRow key={activity._id}>
              <TableCell className="font-medium">
                {activity.bounty ? (
                  <Link
                    href={`https://github.com/${activity.bounty.githubRepoOwner}/${activity.bounty.githubRepoName}/issues/${activity.bountyId?.toString().replace(/\D/g, '') || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    title={activity.bounty.title}
                  >
                    {activity.bounty.title}
                  </Link>
                ) : (
                  'Unknown bounty'
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${statusDot[status] || 'bg-muted-foreground/64'}`}
                  />
                  {statusLabel[status] || status}
                </Badge>
              </TableCell>
              <TableCell>
                {activity.bounty ? (
                  `${activity.bounty.githubRepoOwner}/${activity.bounty.githubRepoName}`
                ) : (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatAmount(activity.amount)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {totalReceived > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total Received</TableCell>
            <TableCell className="text-right">
              {formatAmount(totalReceived)}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
