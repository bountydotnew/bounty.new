'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@bounty/ui/components/chart';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import type { ChartConfig } from '../types/charts';

type DottedLineChartProps = {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  dashed?: boolean;
  height?: number;
};

export function DottedLineChart({
  title,
  description,
  data,
  xKey,
  yKey,
  dashed = true,
  height = 180,
}: DottedLineChartProps) {
  const config = {
    [yKey]: { label: title || yKey, color: 'var(--chart-2)' },
  } as ChartConfig;
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer className="w-full" config={config} style={{ height }}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey={xKey}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Line
              dataKey={yKey}
              dot={false}
              stroke={`var(--color-${yKey})`}
              strokeDasharray={dashed ? '4 4' : undefined}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
