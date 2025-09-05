'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DefaultBarChart } from '@/components/ui/default-bar-chart';
import { mapBatchByParameter, useDatabuddyParameters } from '@/hooks/use-databuddy';

type Props = { websiteId: string; timezone?: string };

export function OverviewTraffic({ websiteId, timezone = 'UTC' }: Props) {
  useDatabuddyParameters({ websiteId, parameters: ['traffic_sources', 'top_referrers'], limit: 100 });

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


