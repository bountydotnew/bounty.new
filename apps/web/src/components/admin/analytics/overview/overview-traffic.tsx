'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { DefaultBarChart } from '@bounty/ui/components/default-bar-chart';
import {
  mapBatchByParameter,
  useDatabuddyParameters,
} from '@bounty/ui/hooks/use-databuddy';

type Props = { websiteId: string; timezone?: string };

function OverviewTraffic({ websiteId, timezone = 'UTC' }: Props) {
  useDatabuddyParameters({
    websiteId,
    parameters: ['traffic_sources', 'top_referrers'],
    limit: 100,
  });

  return (
    <Card className="border-neutral-800 bg-neutral-900/60">
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <DefaultBarChart />
      </CardContent>
    </Card>
  );
}
