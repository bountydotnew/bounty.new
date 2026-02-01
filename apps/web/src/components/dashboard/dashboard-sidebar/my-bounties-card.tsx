'use client';

import { useContext } from 'react';
import { Badge } from '@bounty/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Separator } from '@bounty/ui/components/separator';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import { DollarSign, TrendingUp } from 'lucide-react';
import { DashboardSidebarContext } from './context';

/**
 * DashboardSidebar MyBountiesCard
 *
 * Compound component that displays user's bounties.
 * Must be used within DashboardSidebarProvider.
 *
 * @example
 * ```tsx
 * <DashboardSidebarProvider {...props}>
 *   <DashboardSidebar.MyBountiesCard />
 * </DashboardSidebarProvider>
 * ```
 */
export function MyBountiesCard() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error('MyBountiesCard must be used within DashboardSidebarProvider');
  }

  const { state, actions } = context;
  const { myBounties, isLoadingMyBounties } = state;
  const { onBountyClick } = actions;

  return (
    <Card className="border border-border-strong/20 bg-surface-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp aria-hidden="true" className="h-5 w-5 text-foreground" />
          My Bounties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingMyBounties ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="animate-pulse" key={i}>
                <div className="mb-1 h-4 w-3/4 rounded bg-surface-3" />
                <div className="h-3 w-1/2 rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {myBounties.map((b, index) => (
              <div key={b.id}>
                <div
                  aria-label={
                    onBountyClick ? `View bounty: ${b.title}` : undefined
                  }
                  className="-m-2 cursor-pointer space-y-2 rounded p-2 transition-colors hover:bg-surface-hover"
                  onClick={() => onBountyClick?.(b)}
                  role={onBountyClick ? 'button' : undefined}
                  tabIndex={onBountyClick ? 0 : undefined}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className="truncate pr-2 font-medium text-sm text-foreground"
                      title={b.title}
                    >
                      {b.title}
                    </h4>
                    <Badge
                      aria-label={`Status: ${b.status}`}
                      className="flex-shrink-0 border-border-strong text-gray-400"
                      variant={
                        b.status === 'open' || b.status === 'in_progress'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <DollarSign
                      aria-hidden="true"
                      className="h-3 w-3 text-green-400"
                    />
                    <span
                      aria-label={`Amount: $${b.amount}`}
                      className="font-medium text-green-400"
                    >
                      ${formatLargeNumber(b.amount)}
                    </span>
                  </div>
                </div>
                {index < myBounties.length - 1 && (
                  <Separator className="mt-4 bg-surface-3" />
                )}
              </div>
            ))}
            {myBounties.length === 0 && (
              <p className="text-gray-400 text-sm">No bounties created yet</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
