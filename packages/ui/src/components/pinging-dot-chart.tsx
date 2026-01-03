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

type PingingDotChartProps = {
  title?: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  colorVar?: string;
  dashed?: boolean;
  height?: number;
};

export function PingingDotChart({
  title,
  description,
  data,
  xKey,
  yKey,
  colorVar = 'var(--chart-2)',
  dashed = true,
  height = 180,
}: PingingDotChartProps) {
  const config: ChartConfig = {
    [yKey]: { label: title || yKey, color: colorVar },
  };
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
              dot={<CustomizedDot />}
              stroke={`var(--color-${yKey})`}
              strokeDasharray={dashed ? '4 4' : 0}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const CustomizedDot = (props: React.SVGProps<SVGCircleElement>) => {
  const { cx, cy, stroke } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} fill={stroke} r={3} />
      <circle
        cx={cx}
        cy={cy}
        fill="none"
        opacity="0.8"
        r={3}
        stroke={stroke}
        strokeWidth="1"
      >
        <animate
          attributeName="r"
          dur="1s"
          repeatCount="indefinite"
          values="3;10"
        />
        <animate
          attributeName="opacity"
          dur="1s"
          repeatCount="indefinite"
          values="0.8;0"
        />
      </circle>
    </g>
  );
};
