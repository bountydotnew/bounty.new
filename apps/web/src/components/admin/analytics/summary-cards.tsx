'use client';

import { useMemo } from 'react';
import { GradientAreaChart } from '@/components/ui/gradient-chart';
import { DefaultBarChart } from '@/components/ui/default-bar-chart';
import { RainbowGlowGradientLineChart } from '@/components/ui/rainbow-glow-gradient-line';
import { RoundedPieChart } from '@/components/ui/rounded-pie-chart';
import { DefaultRadialChart } from '@/components/ui/radial-chart';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapBatchByParameter, useDatabuddyParameters } from '@/hooks/use-databuddy';

type Props = { websiteId: string; timezone?: string };

export function SummaryCards({ websiteId }: Props) {
  const { data, isLoading } = useDatabuddyParameters({ websiteId, parameters: ['events_by_date', 'top_pages'] });
  const mapped = useMemo(() => (data ? mapBatchByParameter(data) : {}), [data]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="border-neutral-800 bg-neutral-900/60">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DefaultBarChart />
            <GradientAreaChart />
            <RainbowGlowGradientLineChart />
            <RoundedPieChart />
          </div>
        </CardContent>
      </Card>
      <Card className="border-neutral-800 bg-neutral-900/60">
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <DefaultRadialChart />
        </CardContent>
      </Card>
    </div>
  );
}


