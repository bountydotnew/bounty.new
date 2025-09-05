'use client';

import { TrendingDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bounty/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@bounty/ui/components/chart";
import { Badge } from "@bounty/ui/components/badge";
import type { ChartConfig } from "../types/charts";

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function RainbowGlowGradientLineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Rainbow Line Chart
          <Badge
            className="ml-2 border-none bg-red-500/10 text-red-500"
            variant="outline"
          >
            <TrendingDown className="h-4 w-4" />
            <span>-5.2%</span>
          </Badge>
        </CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickFormatter={(value) => value.slice(0, 3)}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Line
              dataKey="desktop"
              dot={false}
              filter="url(#rainbow-line-glow)"
              stroke="url(#colorUv)"
              strokeWidth={2}
              type="bump"
            />
            <defs>
              <linearGradient id="colorUv" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#0B84CE" stopOpacity={0.8} />
                <stop offset="20%" stopColor="#224CD1" stopOpacity={0.8} />
                <stop offset="40%" stopColor="#3A11C7" stopOpacity={0.8} />
                <stop offset="60%" stopColor="#7107C6" stopOpacity={0.8} />
                <stop offset="80%" stopColor="#C900BD" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#D80155" stopOpacity={0.8} />
              </linearGradient>
              <filter
                height="140%"
                id="rainbow-line-glow"
                width="140%"
                x="-20%"
                y="-20%"
              >
                <feGaussianBlur result="blur" stdDeviation="10" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
