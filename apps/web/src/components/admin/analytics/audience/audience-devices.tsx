'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { DefaultRadialChart } from '@bounty/ui/components/radial-chart';
import { useDatabuddyParameters } from '@bounty/ui/hooks/use-databuddy';
import { useMemo } from 'react';

type Props = { websiteId: string; timezone?: string };

export function AudienceDevices({ websiteId, timezone = 'UTC' }: Props) {
  const { data } = useDatabuddyParameters({
    websiteId,
    parameters: ['devices'],
    limit: 100,
  });
  const results = (data as any)?.data?.results || [];

  const _chartData = useMemo(() => {
    return (results || []).slice(0, 5).map((r: any) => ({
      browser: r.device_type || r.browser || 'other',
      visitors: r.count || r.visitors || 0,
      fill: 'var(--chart-1)',
    }));
  }, [results]);

  return (
    <Card className="border-neutral-800 bg-neutral-900/60">
      <CardHeader>
        <CardTitle>Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <DefaultRadialChart />
      </CardContent>
    </Card>
  );
}
