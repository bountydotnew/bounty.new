'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { mapBatchByParameter, useDatabuddyParameters } from '@/hooks/use-databuddy';

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
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function OverviewTimeseries({ websiteId }: Props) {
  const [days, setDays] = useState(30);
  const { start, end } = useMemo(() => calcRange(days), [days]);

  const { data, isLoading } = useDatabuddyParameters({ websiteId, parameters: ['events_by_date'], startDate: start, endDate: end });
  const mapped = useMemo(() => (data ? mapBatchByParameter(data) : {}), [data]);
  const rows = (mapped['events_by_date'] as any[]) || [];

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        date: r.date || r.day || r.period || 'n/a',
        pageviews: Number(r.pageviews || 0),
        sessions: Number(r.sessions || 0),
        visitors: Number(r.visitors || 0),
      })),
    [rows]
  );

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
                key={p.label}
                className={`rounded border px-2 py-0.5 text-xs ${days === p.days ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'}`}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config as any} className="h-[260px] w-full">
          <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line dataKey="pageviews" stroke="var(--color-pageviews)" dot={false} strokeWidth={1.6} />
            <Line dataKey="sessions" stroke="var(--color-sessions)" dot={false} strokeWidth={1.3} />
            <Line dataKey="visitors" stroke="var(--color-visitors)" dot={false} strokeWidth={1.1} />
          </LineChart>
        </ChartContainer>
        {isLoading && <div className="mt-2 text-muted-foreground text-xs">Loading…</div>}
      </CardContent>
    </Card>
  );
}


