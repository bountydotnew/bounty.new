'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
} from '@bounty/ui/components/tooltip';
import type { ScoreResult } from '@/lib/contributor-score';

function scoreColor(total: number): string {
  if (total >= 80) return 'text-emerald-400';
  if (total >= 60) return 'text-green-400';
  if (total >= 30) return 'text-amber-400';
  return 'text-muted-foreground/50';
}

function scoreRingColor(total: number): string {
  if (total >= 80) return 'stroke-emerald-400';
  if (total >= 60) return 'stroke-green-400';
  if (total >= 30) return 'stroke-amber-400';
  return 'stroke-muted-foreground/30';
}

function scoreLabel(total: number): string {
  if (total >= 80) return 'Highly trusted';
  if (total >= 60) return 'Trusted';
  if (total >= 30) return 'Moderate';
  return 'New contributor';
}

interface ScoreBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-[72px] shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono w-8 text-right shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}

export function ScoreRing({ score }: { score: ScoreResult }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.total / 100) * circumference;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="relative size-9 flex items-center justify-center shrink-0 cursor-default">
          <svg className="size-9 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              strokeWidth="2.5"
              className="stroke-muted/40"
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
              'absolute inset-0 flex items-center justify-center text-[9px] font-semibold font-mono',
              scoreColor(score.total)
            )}
          >
            {score.total}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipPopup side="bottom" sideOffset={6} className="w-56 p-0">
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3 h-3 text-muted-foreground" />
            <span
              className={cn(
                'text-[11px] font-semibold',
                scoreColor(score.total)
              )}
            >
              {scoreLabel(score.total)}
            </span>
          </div>
          <div className="space-y-1.5 mt-2">
            <ScoreBar
              label="Repo activity"
              value={score.repoFamiliarity}
              max={35}
              color="bg-emerald-400/70"
            />
            <ScoreBar
              label="Community"
              value={score.communityStanding}
              max={25}
              color="bg-green-400/70"
            />
            <ScoreBar
              label="Open source"
              value={score.ossInfluence}
              max={20}
              color="bg-blue-400/70"
            />
            <ScoreBar
              label="PR history"
              value={score.prTrackRecord}
              max={20}
              color="bg-amber-400/70"
            />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground mt-2">
            Trust score from profile, repo contributions, and open-source track
            record.
          </p>
        </div>
      </TooltipPopup>
    </Tooltip>
  );
}
