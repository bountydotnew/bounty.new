import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, MessageCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo } from 'react';
import BookmarkButton from '@/components/bounty/bookmark-button';
import { UpvoteButton } from '@/components/bounty/bounty-actions';
import type { Bounty } from '@/types/dashboard';
import { trpc, trpcClient } from '@/utils/trpc';
import { MarkdownContent } from './markdown-content';

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const creatorInitial = bounty.creator.name?.charAt(0)?.toUpperCase() || 'U';
  const creatorName = bounty.creator.name || 'Anonymous';
  const queryClient = useQueryClient();
  const voteCount = initialStats?.voteCount ?? 0;
  const isVotedInitial = initialStats?.isVoted ?? false;
  const voteMutation = useMutation({
    mutationFn: async (input: { bountyId: string; vote: boolean }) => {
      return await trpcClient.bounties.voteBounty.mutate(input);
    },
  });
  const bookmarkMutation = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.toggleBountyBookmark.mutate(input);
    },
  });

  const handleUpvote = () => {
    const votesKey = trpc.bounties.getBountyVotes.queryKey({
      bountyId: bounty.id,
    });
    const previousVotes = queryClient.getQueryData<{
      count: number;
      isVoted: boolean;
    }>(votesKey);
    const nextVotes = previousVotes
      ? {
          count: previousVotes.isVoted
            ? Math.max(0, Number(previousVotes.count) - 1)
            : Number(previousVotes.count) + 1,
          isVoted: !previousVotes.isVoted,
        }
      : { count: isVotedInitial ? 0 : 1, isVoted: !isVotedInitial };
    queryClient.setQueryData(votesKey, nextVotes);
    const previousMany = queryClient.getQueriesData<{
      stats: {
        bountyId: string;
        voteCount: number;
        isVoted: boolean;
        commentCount: number;
        bookmarked: boolean;
      }[];
    }>({
      queryKey: trpc.bounties.getBountyStatsMany.queryKey(undefined) as any,
    });
    const updateList = previousMany.map(([key, previous]) => {
      const current = previous?.stats?.find?.((s) => s.bountyId === bounty.id);
      if (!(previous && current)) return [key, previous] as const;
      const next = {
        stats: previous.stats.map((s) =>
          s.bountyId === bounty.id
            ? {
                ...s,
                voteCount: current.isVoted
                  ? Math.max(0, current.voteCount - 1)
                  : current.voteCount + 1,
                isVoted: !current.isVoted,
              }
            : s
        ),
      };
      queryClient.setQueryData(key, next);
      return [key, previous] as const;
    });
    voteMutation.mutate(
      { bountyId: bounty.id },
      {
        onError: () => {
          if (previousVotes) queryClient.setQueryData(votesKey, previousVotes);
          updateList.forEach(
            ([key, previous]) =>
              previous && queryClient.setQueryData(key, previous)
          );
        },
        onSuccess: (data) => {
          queryClient.setQueryData(votesKey, {
            count: Number(data?.count || 0),
            isVoted: Boolean(data?.voted),
          });
          const manyKeys = queryClient.getQueriesData<{
            stats: {
              bountyId: string;
              voteCount: number;
              isVoted: boolean;
              commentCount: number;
              bookmarked: boolean;
            }[];
          }>({
            queryKey: trpc.bounties.getBountyStatsMany.queryKey(
              undefined
            ) as any,
          });
          manyKeys.forEach(([key, current]) => {
            if (!current) return;
            const next = {
              stats: current.stats.map((s) =>
                s.bountyId === bounty.id
                  ? {
                      ...s,
                      voteCount: Number(data?.count || 0),
                      isVoted: Boolean(data?.voted),
                    }
                  : s
              ),
            };
            queryClient.setQueryData(key, next);
          });
        },
      }
    );
  };

  const handleToggleBookmark = () => {
    const previousMany = queryClient.getQueriesData<{
      stats: {
        bountyId: string;
        voteCount: number;
        isVoted: boolean;
        commentCount: number;
        bookmarked: boolean;
      }[];
    }>({
      queryKey: trpc.bounties.getBountyStatsMany.queryKey(undefined) as any,
    });
    const updateList = previousMany.map(([key, previous]) => {
      const current = previous?.stats?.find?.((s) => s.bountyId === bounty.id);
      if (!(previous && current)) return [key, previous] as const;
      const next = {
        stats: previous.stats.map((s) =>
          s.bountyId === bounty.id ? { ...s, bookmarked: !s.bookmarked } : s
        ),
      };
      queryClient.setQueryData(key, next);
      return [key, previous] as const;
    });
    bookmarkMutation.mutate(
      { bountyId: bounty.id },
      {
        onError: () => {
          updateList.forEach(
            ([key, previous]) =>
              previous && queryClient.setQueryData(key, previous)
          );
        },
        onSettled: () =>
          queryClient.invalidateQueries({
            queryKey: trpc.bounties.getBountyStatsMany.queryKey(
              undefined
            ) as any,
          }),
      }
    );
  };

  return (
    <div
      aria-label={`View bounty: ${bounty.title}`}
      className="flex w-full cursor-pointer flex-col items-start gap-3 rounded-lg border border-[#383838]/20 bg-[#191919] p-6 transition duration-100 ease-out active:scale-[.98]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              alt={bounty.creator.name || ''}
              src={bounty.creator.image || ''}
            />
            <AvatarFallback>{creatorInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white">
                {creatorName}
              </span>
              <div className="flex h-4 w-4 rotate-45 transform items-center justify-center rounded bg-blue-500">
                <Check className="-rotate-45 h-2.5 w-2.5 transform text-white" />
              </div>
            </div>
            <span className="text-gray-400 text-xs capitalize">
              {bounty.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UpvoteButton
            isVoted={isVotedInitial}
            onUpvote={handleUpvote}
            voteCount={voteCount}
          />
          <BookmarkButton
            bookmarked={initialStats?.bookmarked}
            bountyId={bounty.id}
            onToggle={handleToggleBookmark}
          />
          <span className="font-semibold text-green-400 text-sm">
            ${formatLargeNumber(bounty.amount)}
          </span>
        </div>
      </div>

      <div className="w-full">
        <h3 className="mb-2 line-clamp-2 font-medium text-base text-white">
          {bounty.title}
        </h3>
        <div className="relative text-gray-400 text-sm">
          <div className="max-h-24 overflow-hidden pr-1">
            <MarkdownContent content={bounty.description} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-[#191919]" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-4 text-gray-400 text-xs">
        <div className="flex items-center gap-1">
          <Clock aria-hidden="true" className="h-4 w-4" />
          <time
            dateTime={bounty.createdAt}
            title={new Date(bounty.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(bounty.createdAt), {
              addSuffix: true,
            })}
          </time>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          <span>
            {initialStats?.commentCount ?? 0}{' '}
            {(initialStats?.commentCount ?? 0) === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
    </div>
  );
});
