'use client';

import { GradientAreaChart } from '@bounty/ui/components/gradient-chart';
import { DefaultBarChart } from '@bounty/ui/components/default-bar-chart';
import { RainbowGlowGradientLineChart } from '@bounty/ui/components/rainbow-glow-gradient-line';
import { RoundedPieChart } from '@bounty/ui/components/rounded-pie-chart';
import { DefaultRadialChart } from '@bounty/ui/components/radial-chart';

import { Card, CardContent, CardHeader, CardTitle } from '@bounty/ui/components/card';

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


