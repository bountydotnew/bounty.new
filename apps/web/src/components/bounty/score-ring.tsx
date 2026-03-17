'use client';

import { SecurityIcon } from '@bounty/ui';
import { cn } from '@bounty/ui/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from '@bounty/ui/components/popover';
import type { ScoreResult } from '@/lib/contributor-score';

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
    return 'Deep repo familiarity, strong community presence, and a proven open-source track record.';
  if (total >= 60)
    return 'Solid activity in this repo and good standing in the community.';
  if (total >= 30)
    return 'Some history here but limited repo activity or community presence.';
  return 'New to this repo with little or no prior activity.';
}

const CATEGORIES = [
  {
    label: 'Repo activity',
    key: 'repoFamiliarity' as const,
    max: 35,
    color: 'bg-emerald-400',
  },
  {
    label: 'Community',
    key: 'communityStanding' as const,
    max: 25,
    color: 'bg-green-400',
  },
  {
    label: 'Open source',
    key: 'ossInfluence' as const,
    max: 20,
    color: 'bg-blue-400',
  },
  {
    label: 'PR history',
    key: 'prTrackRecord' as const,
    max: 20,
    color: 'bg-amber-400',
  },
];

export function ScoreRing({ score }: { score: ScoreResult }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.total / 100) * circumference;

  return (
    <Popover>
      <PopoverTrigger>
        <div className="relative size-9 flex items-center justify-center shrink-0 cursor-pointer">
          <svg className="size-9 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              strokeWidth="2.5"
              className="stroke-muted-foreground/15"
            />
            <circle
              cx="18"
              cy="18"
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
              'absolute inset-0 flex items-center justify-center text-[13px] font-semibold font-mono',
              scoreColor(score.total)
            )}
          >
            {score.total}
          </span>
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
