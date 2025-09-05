'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DefaultBarChart } from '@/components/ui/default-bar-chart';
import { GradientAreaChart } from '@/components/ui/gradient-chart';
import { DefaultRadialChart } from '@/components/ui/radial-chart';
import { RainbowGlowGradientLineChart } from '@/components/ui/rainbow-glow-gradient-line';
import { RoundedPieChart } from '@/components/ui/rounded-pie-chart';

type Props = { websiteId: string; timezone?: string };

export function SummaryCards({}: Props) {
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
