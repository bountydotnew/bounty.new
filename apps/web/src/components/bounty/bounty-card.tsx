import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';
import { formatDistanceToNow } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import { memo } from 'react';
import type { Bounty } from '@/types/dashboard';
import { CommentsIcon, GithubIcon, SubmissionsPeopleIcon } from '@bounty/ui';

interface BountyCardProps {
  bounty: Bounty;
  stats?: {
    commentCount: number;
    voteCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
}

export const BountyCard = memo(function BountyCard({
  bounty,
  stats: initialStats,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  };

  const creatorName = bounty.creator.name || 'Anonymous';
  const creatorInitial = creatorName.charAt(0).toLowerCase();

  // Generate color from creator name (simple hash-based approach)
  const colors = [
    { bg: '#E66700', border: '#C95900' },
    { bg: '#0066FF', border: '#0052CC' },
    { bg: '#00B894', border: '#00A085' },
    { bg: '#E84393', border: '#D63031' },
    { bg: '#6C5CE7', border: '#5F4FCF' },
  ];
  const colorIndex = creatorName.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  const commentCount = initialStats?.commentCount ?? 0;
  const formattedAmount = `$${bounty.amount.toLocaleString()}`;

  // Extract repo name from repositoryUrl if available, otherwise use hardcoded
  const repoDisplay = bounty.repositoryUrl
    ? bounty.repositoryUrl
        .replace('https://github.com/', '')
        .replace('http://github.com/', '')
    : 'ripgrim/bountydotnew';

  return (
    <button
      aria-label={`View bounty: ${bounty.title}`}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-[#232323] bg-[#191919] p-4 sm:p-5 shadow-[0px_2px_3px_#00000033] transition duration-100 ease-out active:scale-[.98] min-w-0 text-left"
      onClick={handleClick}
      type="button"
    >
      {/* Top row: Creator + Amount */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[5px]">
          {bounty.creator.image ? (
            <Avatar className="h-4 w-4">
              <AvatarImage alt={creatorName} src={bounty.creator.image} />
              <AvatarFallback className="h-4 w-4 text-[8px]">
                {creatorInitial}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className="flex h-4 w-4 items-center justify-center rounded-[6px] text-[8px] leading-[150%] text-white shadow-[inset_0px_2px_3px_#00000033]"
              style={{
                backgroundColor: avatarColor.bg,
                outline: `1px solid ${avatarColor.border}`,
                outlineOffset: '-1px',
              }}
            >
              {creatorInitial}
            </div>
          )}
          <span className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
            {creatorName}
          </span>
        </div>
        <div className="flex h-5 items-center gap-[5px] px-[3px]">
          <span className="text-[13px] font-semibold leading-[150%] text-[#6CFF0099]">
            {formattedAmount}
          </span>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex h-[19.5px] items-center gap-[5px] min-w-0 flex-1">
          <span className="text-[13px] font-medium leading-[150%] text-white whitespace-normal break-words min-w-0">
            {bounty.title}
          </span>
        </div>
      </div>

      {/* Bottom row: Stats + Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-[6px] sm:gap-[10px] min-w-0 flex-1">
          {/* Comments */}
          <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
            <div className="flex h-fit items-center opacity-30">
              <CommentsIcon className="h-4 w-4" />
            </div>
            <span className="lg:text-[13px] text-[11px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          {/* Submissions (hardcoded) */}
          <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
            <div className="flex h-fit items-center opacity-100">
              <SubmissionsPeopleIcon className="h-4 w-4" />
            </div>
            <span className="text-[11px] sm:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
              10 submissions
            </span>
          </div>

          {/* GitHub repo */}
          <div className="flex h-fit items-center gap-[5px] px-[3px] min-w-0 flex-1 sm:flex-initial">
            <div className="flex h-fit items-center opacity-100 shrink-0">
              <GithubIcon className="h-3 w-3" />
            </div>
            <span className="h-5 text-[11px] flex items-center md:text-[13px] lg:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0">
              {repoDisplay}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
          <span className="h-5 text-[11px] sm:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
            {formatDistanceToNow(new Date(bounty.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </button>
  );
});
