'use client';

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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
  } as any;
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
