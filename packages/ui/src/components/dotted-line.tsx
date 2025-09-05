"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

type DottedLineChartProps = {
  title?: string;
  description?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  dashed?: boolean;
  height?: number;
};

export function DottedLineChart({ title, description, data, xKey, yKey, dashed = true, height = 180 }: DottedLineChartProps) {
  const config = { [yKey]: { label: title || yKey, color: `var(--chart-2)` } } as any;
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={config} className="w-full" style={{ height }}>
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line dataKey={yKey} type="linear" stroke={`var(--color-${yKey})`} dot={false} strokeDasharray={dashed ? "4 4" : undefined} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
