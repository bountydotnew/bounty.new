import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, MessageCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo } from 'react';
import BookmarkButton from '@/components/bounty/bookmark-button';
import { UpvoteButton } from '@/components/bounty/bounty-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import type { Bounty } from '@/types/dashboard';
import { trpc } from '@/utils/trpc';
import { MarkdownContent } from './markdown-content';

interface BountyCardProps {
  bounty: Bounty;
}

export const BountyCard = memo(function BountyCard({
  bounty,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const comments = useQuery(
    trpc.bounties.getBountyComments.queryOptions({ bountyId: bounty.id })
  );

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
  const votes = useQuery(
    trpc.bounties.getBountyVotes.queryOptions({ bountyId: bounty.id })
  );
  const voteMutation = useMutation({
    ...trpc.bounties.voteBounty.mutationOptions(),
  });

  const handleUpvote = () => {
    const key = trpc.bounties.getBountyVotes.queryKey({ bountyId: bounty.id });
    const previous = queryClient.getQueryData<{
      count: number;
      isVoted: boolean;
    }>(key);
    const next = previous
      ? {
          count: previous.isVoted
            ? Math.max(0, Number(previous.count) - 1)
            : Number(previous.count) + 1,
          isVoted: !previous.isVoted,
        }
      : { count: 1, isVoted: true };
    queryClient.setQueryData(key, next);
    voteMutation.mutate(
      { bountyId: bounty.id },
      {
        onError: () => {
          if (previous) {
            queryClient.setQueryData(key, previous);
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      }
    );
  };

  return (
    <div
      aria-label={`View bounty: ${bounty.title}`}
      className="flex w-full cursor-pointer flex-col items-start gap-3 rounded-lg border border-[#383838]/20 bg-[#191919] p-6 transition duration-100 ease-out active:scale-[.98]"
      /*className="cursor-pointer bountyCard flex w-full flex-col items-start gap-3 rounded-lg bg-[#1D1D1D] p-6 hover:bg-[#2A2A28] transition-colors  */
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
            isVoted={votes.data?.isVoted ?? false}
            onUpvote={handleUpvote}
            voteCount={votes.data?.count ?? 0}
          />
          <BookmarkButton bountyId={bounty.id} />
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
            {comments.data?.length ?? 0}{' '}
            {comments.data?.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
    </div>
  );
});
