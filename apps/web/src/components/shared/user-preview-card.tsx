'use client';

import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import {
  PreviewCard,
  PreviewCardTrigger,
  PreviewCardPopup,
} from '@bounty/ui/components/preview-card';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';

interface UserPreviewCardProps {
  children: React.ReactNode;
  name: string;
  handle?: string | null;
  image?: string | null;
  href?: string;
  /** Use when nested inside a <button> — renders a <span> instead of <a> */
  asSpan?: boolean;
}

function scoreColor(total: number): string {
  if (total >= 80) return 'text-emerald-400';
  if (total >= 60) return 'text-green-400';
  if (total >= 30) return 'text-amber-400';
  return 'text-orange-400';
}

function scoreRingStroke(total: number): string {
  if (total >= 80) return 'stroke-emerald-400';
  if (total >= 60) return 'stroke-green-400';
  if (total >= 30) return 'stroke-amber-400';
  return 'stroke-orange-400';
}

function MiniScoreRing({ total }: { total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (total / 100) * circ;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0 size-7">
      <svg className="size-25 -rotate-90" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r={r}
          fill="none"
          strokeWidth="2"
          className="stroke-muted-foreground/15"
        />
        <circle
          cx="10"
          cy="10"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={scoreRingStroke(total)}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[13px] font-semibold font-mono',
          scoreColor(total)
        )}
      >
        {total}
      </span>
    </span>
  );
}

export function UserPreviewCard({
  children,
  name,
  handle,
  image,
  href,
  asSpan,
}: UserPreviewCardProps) {
  const profileHref = href || (handle ? `/profile/${handle}` : undefined);

  return (
    <PreviewCard>
      <PreviewCardTrigger
        href={profileHref || '#'}
        {...(asSpan ? { render: <span className="inline-flex" /> } : {})}
      >
        {children}
      </PreviewCardTrigger>
      <PreviewCardPopup sideOffset={8} align="start" className="w-[288px] !p-0">
        <UserPreviewCardContent name={name} handle={handle} image={image} />
      </PreviewCardPopup>
    </PreviewCard>
  );
}

function UserPreviewCardContent({
  name,
  handle,
  image,
}: {
  name: string;
  handle?: string | null;
  image?: string | null;
}) {
  const { data, isLoading } = useQuery({
    ...trpc.profiles.getProfileScore.queryOptions({
      githubUsername: handle || '',
    }),
    enabled: !!handle,
    staleTime: 60_000,
  });

  const score = data?.score;
  const dossier = data?.dossier;
  const bountyStats = data?.bountyStats;
  const settled = !isLoading;
  const joinedDate = dossier?.accountCreated
    ? format(new Date(dossier.accountCreated), 'MMM yyyy')
    : null;

  return (
    <div className="p-3 w-full">
      {/* Identity + trust score */}
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14 shrink-0 rounded-full ring-2 ring-border/50">
          {image && <AvatarImage alt={name} src={image} />}
          <AvatarFacehash name={name} size={56} />
        </Avatar>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate">
              {name}
            </span>
            {score && <MiniScoreRing total={score.total} />}
          </div>
          {handle && (
            <div className="text-xs text-foreground/45">@{handle}</div>
          )}
        </div>
      </div>

      {/* Bounty stats */}
      <div className="flex items-center mt-3 pt-3 border-t border-border gap-3">
        {settled ? (
          bountyStats ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">
                  {bountyStats.bountiesCompleted}
                </span>
                <span className="text-xs text-foreground/45">completed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">
                  {bountyStats.bountiesCreated}
                </span>
                <span className="text-xs text-foreground/45">created</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-foreground/30">
              No bounty activity yet
            </span>
          )
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-3 w-16 rounded bg-foreground/[0.06]" />
            <div className="h-3 w-14 rounded bg-foreground/[0.06]" />
          </div>
        )}
      </div>

      {/* Joined */}
      {joinedDate && (
        <div className="flex items-center gap-1.5 mt-2">
          <CalendarDays className="w-3 h-3 text-foreground/25 shrink-0" />
          <span className="text-[10px] text-foreground/35">
            Joined {joinedDate}
          </span>
        </div>
      )}
    </div>
  );
}
