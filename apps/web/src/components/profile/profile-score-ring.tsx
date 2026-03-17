'use client';

import { SecurityIcon } from '@bounty/ui';
import { cn } from '@bounty/ui/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from '@bounty/ui/components/popover';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

interface ProfileScoreResult {
  total: number;
  communityPresence: number;
  ossImpact: number;
  activity: number;
  ecosystem: number;
}

function scoreColor(total: number): string {
  if (total >= 80) return 'text-emerald-400';
  if (total >= 60) return 'text-green-400';
  if (total >= 30) return 'text-amber-400';
  return 'text-orange-400';
}

function scoreRingColor(total: number): string {
  if (total >= 80) return 'stroke-emerald-400';
  if (total >= 60) return 'stroke-green-400';
  if (total >= 30) return 'stroke-amber-400';
  return 'stroke-orange-400';
}

function scoreLabel(total: number): string {
  if (total >= 80) return 'Highly trusted';
  if (total >= 60) return 'Trusted';
  if (total >= 30) return 'Moderate';
  return 'New contributor';
}

function scoreDescription(total: number): string {
  if (total >= 80)
    return 'A highly established developer with strong community presence and significant open-source contributions.';
  if (total >= 60)
    return 'An active developer with solid contributions and good community standing.';
  if (total >= 30)
    return 'A developing presence on GitHub with growing contributions and engagement.';
  return 'A newer GitHub user building their profile and contribution history.';
}

const CATEGORIES = [
  {
    key: 'communityPresence' as const,
    label: 'Community',
    max: 25,
    color: 'bg-emerald-400',
  },
  {
    key: 'ossImpact' as const,
    label: 'OSS Impact',
    max: 25,
    color: 'bg-blue-400',
  },
  {
    key: 'activity' as const,
    label: 'Activity',
    max: 30,
    color: 'bg-green-400',
  },
  {
    key: 'ecosystem' as const,
    label: 'Ecosystem',
    max: 20,
    color: 'bg-amber-400',
  },
];

function ScoreRingDisplay({ score }: { score: ProfileScoreResult }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.total / 100) * circumference;

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="2.5"
                className="stroke-muted-foreground/15"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className={cn(
                  'transition-all duration-500',
                  scoreRingColor(score.total)
                )}
              />
            </svg>
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center text-xs font-semibold font-mono',
                scoreColor(score.total)
              )}
            >
              {score.total}
            </span>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-mono text-foreground/40 uppercase tracking-widest">
              Trust Score
            </div>
            <div className={cn('text-xs font-medium', scoreColor(score.total))}>
              {scoreLabel(score.total)}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverPopup side="bottom" sideOffset={6} tooltipStyle className="w-72">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <SecurityIcon
                className={cn('w-4 h-4', scoreColor(score.total))}
              />
              <span
                className={cn('text-sm font-semibold', scoreColor(score.total))}
              >
                {scoreLabel(score.total)}
              </span>
            </div>
            <span
              className={cn(
                'text-sm font-mono font-semibold',
                scoreColor(score.total)
              )}
            >
              {score.total}/100
            </span>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-foreground/60 mb-4">
            {scoreDescription(score.total)}
          </p>

          {/* Breakdown */}
          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => {
              const value = score[cat.key];
              const pct = Math.round((value / cat.max) * 100);
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/80">
                      {cat.label}
                    </span>
                    <span className="text-xs font-mono text-foreground/60">
                      {value}/{cat.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', cat.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}

/**
 * Fetches and displays the profile-level trust score for a GitHub user.
 * Shows a loading skeleton while fetching, hides entirely if no score available.
 */
export function ProfileScoreRing({
  githubUsername,
}: {
  githubUsername: string;
}) {
  const { data, isLoading } = useQuery({
    ...trpc.profiles.getProfileScore.queryOptions({ githubUsername }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-foreground/[0.06]" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-16 rounded bg-foreground/[0.06]" />
          <div className="h-3 w-12 rounded bg-foreground/[0.06]" />
        </div>
      </div>
    );
  }

  if (!data?.score) return null;

  return <ScoreRingDisplay score={data.score} />;
}
