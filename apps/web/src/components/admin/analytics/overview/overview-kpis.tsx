'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapBatchByParameter, useDatabuddyParameters } from '@/hooks/use-databuddy';
import { PingingDotChart } from '@/components/ui/pinging-dot-chart';
import { DottedLineChart } from '@/components/ui/dotted-line';

type Props = { websiteId: string; timezone?: string };

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

export function OverviewKPIs({ websiteId, timezone = 'UTC' }: Props) {
    const [days, setDays] = useState(30);
    const { start, end } = useMemo(() => calcRange(days), [days]);
    const { data, isLoading } = useDatabuddyParameters({ websiteId, parameters: ['summary_metrics', 'events_by_date'], startDate: start, endDate: end });
    const mapped = useMemo(() => (data ? mapBatchByParameter(data) : {}), [data]);


    const kpis = useMemo(() => {
        const r1 = (v: unknown) => {
            const n = Number(v);
            return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
        };
        const summary = (mapped['summary_metrics']?.[0] as any) || {};
        const pagesPerSession =
            summary.pages_per_session ??
            (summary.pageviews && summary.sessions
                ? Number(summary.pageviews) / Number(summary.sessions)
                : undefined);
        const rows = (mapped['events_by_date'] as any[]) || [];
        const sessionsSeries = rows.map((r) => ({ date: r.date || r.day || r.period, sessions: r1(r.sessions || 0) || 0 }));
        const pageviewsSeries = rows.map((r) => ({ date: r.date || r.day || r.period, pageviews: r1(r.pageviews || 0) || 0 }));
        const visitorsSeries = rows.map((r) => ({ date: r.date || r.day || r.period, unique_visitors: r1(r.visitors || r.unique_visitors || 0) || 0 }));
        const ppsSeries = rows.map((r) => {
            const pv = Number(r.pageviews || 0);
            const ss = Number(r.sessions || 0);
            const val = ss > 0 ? pv / ss : 0;
            return { date: r.date || r.day || r.period, pages_per_session: r1(val) || 0 };
        });
        const bounce = r1(summary.bounce_rate || 0) || 0;
        const bounceSeries = (rows.length ? rows : [{ date: start }, { date: end }]).map((r: any) => ({ date: r.date || r.day || r.period, bounce_rate: bounce }));
        const avgDur = r1(summary.avg_session_duration || summary.session_duration || 0) || 0;
        const avgDurSeries = (rows.length ? rows : [{ date: start }, { date: end }]).map((r: any) => ({ date: r.date || r.day || r.period, avg_session_duration: avgDur }));

        return [
            { label: 'Sessions', value: r1(summary.sessions) ?? '–', type: 'sessions', series: sessionsSeries },
            { label: 'Pageviews', value: r1(summary.pageviews) ?? '–', type: 'pageviews', series: pageviewsSeries },
            { label: 'Pages / Session', value: pagesPerSession !== undefined ? (r1(pagesPerSession) ?? '–') : '–', type: 'pages_per_session', series: ppsSeries },
            { label: 'Bounce Rate', value: r1(summary.bounce_rate) ?? '–', type: 'bounce_rate', series: bounceSeries },
            { label: 'Avg. Session', value: r1(summary.avg_session_duration ?? summary.session_duration) ?? '–', type: 'avg_session_duration', series: avgDurSeries },
            { label: 'Unique Visitors', value: r1(summary.unique_visitors ?? summary.visitors) ?? '–', type: 'unique_visitors', series: visitorsSeries },
        ];
    }, [mapped]);


    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Range</span>
                <div className="flex gap-1">
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
                <span className="ml-auto text-muted-foreground text-xs">{start} → {end}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {kpis.map((k) => (
                    <DottedLineChart
                        key={k.label}
                        title={k.label}
                        description={isLoading ? '…' : String(k.value)}
                        data={(k as any).series || []}
                        xKey="date"
                        yKey={(k as any).type || ''}
                        height={140}
                    />
                ))}
            </div>
        </div>
    );
}


