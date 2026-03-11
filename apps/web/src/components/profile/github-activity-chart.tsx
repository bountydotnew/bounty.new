'use client';

import { cloneElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface GitHubActivityChartProps {
  username: string;
}

async function fetchGitHubContributions(username: string) {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch contributions');
  }
  const data = await response.json();
  return data.contributions;
}

export function GitHubActivityChart({ username }: GitHubActivityChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['github-contributions', username],
    queryFn: () => fetchGitHubContributions(username),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  if (isLoading) {
    return (
      <div className="h-[140px] w-full animate-pulse rounded-xl bg-surface-1" />
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">
        GitHub Activity
      </h3>
      <div className="flex justify-center overflow-x-auto">
        <ActivityCalendar
          data={data}
          theme={{
            light: ['#191919', '#0e4429', '#006d32', '#26a641', '#39d353'],
            dark: ['#191919', '#0e4429', '#006d32', '#26a641', '#39d353'],
          }}
          colorScheme="dark"
          labels={{
            totalCount: '{{count}} contributions in the last year',
          }}
          renderBlock={(block: React.ReactElement<any>, activity: { count: number; date: string }) =>
            cloneElement(block, {
              'data-tooltip-id': 'github-tooltip',
              'data-tooltip-content': `${activity.count} contributions on ${activity.date}`,
            })
          }
        />
        <ReactTooltip id="github-tooltip" className="z-50" />
      </div>
    </div>
  );
}
