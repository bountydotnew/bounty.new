"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

type PingingDotChartProps = {
  title?: string;
  description?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  colorVar?: string;
  dashed?: boolean;
  height?: number;
};

export function PingingDotChart({ title, description, data, xKey, yKey, colorVar = "var(--chart-2)", dashed = true, height = 180 }: PingingDotChartProps) {
  const config: ChartConfig = { [yKey]: { label: title || yKey, color: colorVar } };
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
            <Line dataKey={yKey} type="linear" stroke={`var(--color-${yKey})`} strokeDasharray={dashed ? "4 4" : undefined} dot={<CustomizedDot />} />
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
      <circle cx={cx} cy={cy} r={3} fill={stroke} />
      <circle cx={cx} cy={cy} r={3} stroke={stroke} fill="none" strokeWidth="1" opacity="0.8">
        <animate attributeName="r" values="3;10" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};
