'use client';

import { useMemo, useState } from 'react';
import { mapBatchByParameter, useDatabuddyParameters } from '@/hooks/use-databuddy';
import { DottedLineChart } from '@/components/ui/dotted-line';

type Props = { websiteId: string };

interface EventsByDateRow {
    date?: string;
    day?: string;
    period?: string;
    pageviews?: number;
    sessions?: number;
    visitors?: number;
    unique_visitors?: number;
}

interface SummaryMetricsRow {
    pageviews?: number;
    unique_visitors?: number;
    sessions?: number;
    bounce_rate?: number;
    avg_session_duration?: number;
    session_duration?: number;
    visitors?: number;
    pages_per_session?: number;
}

type KpiKey = 'sessions' | 'pageviews' | 'unique_visitors' | 'pages_per_session' | 'bounce_rate' | 'avg_session_duration';

interface KpiSeriesPoint {
    date: string;
    sessions?: number;
    pageviews?: number;
    unique_visitors?: number;
    pages_per_session?: number;
    bounce_rate?: number;
    avg_session_duration?: number;
}

interface Kpi {
    label: string;
    value: string | number;
    type: KpiKey;
    series: KpiSeriesPoint[];
}

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

export function OverviewKPIs({ websiteId }: Props) {
    const [days, setDays] = useState(30);
    const { start, end } = useMemo(() => calcRange(days), [days]);
    const { data, isLoading } = useDatabuddyParameters({ websiteId, parameters: ['summary_metrics', 'events_by_date'], startDate: start, endDate: end });
    const mapped = useMemo(() => (data ? mapBatchByParameter(data) : {}), [data]);


    const kpis: Kpi[] = useMemo(() => {
        const r1 = (v: unknown) => {
            const n = Number(v);
            return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
        };
        const summaryArr = Array.isArray(mapped['summary_metrics']) ? (mapped['summary_metrics'] as SummaryMetricsRow[]) : [];
        const summary: SummaryMetricsRow = summaryArr[0] || {};
        const pagesPerSession =
            summary.pages_per_session ??
            (summary.pageviews && summary.sessions
                ? Number(summary.pageviews) / Number(summary.sessions)
                : undefined);
        const rows = Array.isArray(mapped['events_by_date']) ? (mapped['events_by_date'] as EventsByDateRow[]) : [];
        const sessionsSeries: KpiSeriesPoint[] = rows.map((r) => ({ date: (r.date || r.day || r.period || '') as string, sessions: r1(r.sessions || 0) || 0 }));
        const pageviewsSeries: KpiSeriesPoint[] = rows.map((r) => ({ date: (r.date || r.day || r.period || '') as string, pageviews: r1(r.pageviews || 0) || 0 }));
        const visitorsSeries: KpiSeriesPoint[] = rows.map((r) => ({ date: (r.date || r.day || r.period || '') as string, unique_visitors: r1(r.visitors || r.unique_visitors || 0) || 0 }));
        const ppsSeries: KpiSeriesPoint[] = rows.map((r) => {
            const pv = Number(r.pageviews || 0);
            const ss = Number(r.sessions || 0);
            const val = ss > 0 ? pv / ss : 0;
            return { date: (r.date || r.day || r.period || '') as string, pages_per_session: r1(val) || 0 };
        });
        const bounce = r1(summary.bounce_rate || 0) || 0;
        const fallbackDates: KpiSeriesPoint[] = [
            { date: start },
            { date: end },
        ];
        const bounceSeries: KpiSeriesPoint[] = (rows.length ? rows : fallbackDates).map((r) => ({ date: ((r as EventsByDateRow).date || (r as EventsByDateRow).day || (r as EventsByDateRow).period || '') as string, bounce_rate: bounce }));
        const avgDur = r1(summary.avg_session_duration || summary.session_duration || 0) || 0;
        const avgDurSeries: KpiSeriesPoint[] = (rows.length ? rows : fallbackDates).map((r) => ({ date: ((r as EventsByDateRow).date || (r as EventsByDateRow).day || (r as EventsByDateRow).period || '') as string, avg_session_duration: avgDur }));

        const out: Kpi[] = [
            { label: 'Sessions', value: r1(summary.sessions) ?? '–', type: 'sessions', series: sessionsSeries },
            { label: 'Pageviews', value: r1(summary.pageviews) ?? '–', type: 'pageviews', series: pageviewsSeries },
            { label: 'Pages / Session', value: pagesPerSession !== undefined ? (r1(pagesPerSession) ?? '–') : '–', type: 'pages_per_session', series: ppsSeries },
            { label: 'Bounce Rate', value: r1(summary.bounce_rate) ?? '–', type: 'bounce_rate', series: bounceSeries },
            { label: 'Avg. Session', value: r1(summary.avg_session_duration ?? summary.session_duration) ?? '–', type: 'avg_session_duration', series: avgDurSeries },
            { label: 'Unique Visitors', value: r1(summary.unique_visitors ?? summary.visitors) ?? '–', type: 'unique_visitors', series: visitorsSeries },
        ];
        return out;
    }, [mapped, start, end]);


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
                        data={k.series}
                        xKey="date"
                        yKey={k.type}
                        height={140}
                    />
                ))}
            </div>
        </div>
    );
}


