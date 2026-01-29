'use client';

import { useContext } from 'react';
import { Badge } from '@bounty/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import { DashboardSidebarContext } from './context';

/**
 * DashboardSidebar RecommendationsCard
 *
 * Compound component that displays recommended bounties.
 * Must be used within DashboardSidebarProvider.
 *
 * @example
 * ```tsx
 * <DashboardSidebarProvider {...props}>
 *   <DashboardSidebar.RecommendationsCard />
 * </DashboardSidebarProvider>
 * ```
 */
export function RecommendationsCard() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error('RecommendationsCard must be used within DashboardSidebarProvider');
  }

  const { state } = context;
  const { recommendations } = state;

  return (
    <Card className="border border-[#383838]/20 bg-[#1D1D1D]">
      <CardHeader>
        <CardTitle className="text-white">Recommended</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((bounty) => (
            <div
              className="cursor-pointer rounded-lg border border-[#383838]/20 p-3 transition-colors hover:bg-[#2A2A28]"
              key={bounty.id}
            >
              <h4 className="mb-1 font-medium text-sm text-white">
                {bounty.title}
              </h4>
              <p
                className="mb-2 text-gray-400 text-xs"
                title={bounty.description}
              >
                {bounty.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  className="border-[#383838] text-gray-400 text-xs"
                  variant="outline"
                >
                  {bounty.technology}
                </Badge>
                <span className="font-medium text-green-400 text-sm">
                  ${formatLargeNumber(bounty.amount)}
                </span>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-gray-400 text-sm">No recommendations yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
