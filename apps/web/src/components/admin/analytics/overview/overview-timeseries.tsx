'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@bounty/ui/components/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@bounty/ui/components/chart';
import { mapBatchByParameter, useDatabuddyParameters } from '@bounty/ui/hooks/use-databuddy';

type Props = { websiteId: string };

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function calcRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function OverviewTimeseries({ websiteId }: Props) {
  const [days, setDays] = useState(30);
  const { start, end } = useMemo(() => calcRange(days), [days]);

  const { data, isLoading } = useDatabuddyParameters({
    websiteId,
    parameters: ['events_by_date'],
    startDate: start,
    endDate: end,
  });
  const mapped = useMemo(() => (data ? mapBatchByParameter(data) : {}), [data]);
  const rows = useMemo(() => (mapped.events_by_date as any[]) || [], [mapped]);

  const chartData = useMemo(() => {
    const r1 = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
    };
    return rows.map((r) => ({
      date: r.date || r.day || r.period || 'n/a',
      pageviews: r1(r.pageviews || 0),
      sessions: r1(r.sessions || 0),
      visitors: r1(r.visitors || 0),
    }));
  }, [rows]);

  const config = {
    pageviews: { label: 'Pageviews', color: 'var(--chart-1)' },
    sessions: { label: 'Sessions', color: 'var(--chart-2)' },
    visitors: { label: 'Visitors', color: 'var(--chart-3)' },
  } as const;

  return (
    <Card className="border-neutral-800 bg-neutral-900/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Activity</CardTitle>
          <div className="ml-auto flex gap-1">
            {PRESETS.map((p) => (
              <button
                className={`rounded border px-2 py-0.5 text-xs ${days === p.days ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'}`}
                key={p.label}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[260px] w-full" config={config as any}>
          <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Line
              dataKey="pageviews"
              dot={false}
              stroke="var(--color-pageviews)"
              strokeWidth={1.6}
            />
            <Line
              dataKey="sessions"
              dot={false}
              stroke="var(--color-sessions)"
              strokeWidth={1.3}
            />
            <Line
              dataKey="visitors"
              dot={false}
              stroke="var(--color-visitors)"
              strokeWidth={1.1}
            />
          </LineChart>
        </ChartContainer>
        {isLoading && (
          <div className="mt-2 text-muted-foreground text-xs">Loading…</div>
        )}
      </CardContent>
    </Card>
  );
}
