import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Clock, MessageCircle } from "lucide-react";
import type { Bounty } from "@/types/dashboard";
import { useRouter, usePathname } from "next/navigation";
import { addNavigationContext } from "@/hooks/use-navigation-context";
import { formatLargeNumber } from "@/lib/utils";
import { ArrowUpIcon, Bookmark } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";
import { UpvoteButton } from "@/components/bounty/bounty-actions";
import BookmarkButton from "@/components/bounty/bookmark-button";

interface BountyCardProps {
  bounty: Bounty;
}

export const BountyCard = memo(function BountyCard({
  bounty,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const comments = useQuery(trpc.bounties.getBountyComments.queryOptions({ bountyId: bounty.id }));

  const handleClick = () => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const creatorInitial = bounty.creator.name?.charAt(0)?.toUpperCase() || "U";
  const creatorName = bounty.creator.name || "Anonymous";
  const queryClient = useQueryClient();
  const votes = useQuery(trpc.bounties.getBountyVotes.queryOptions({ bountyId: bounty.id }));
  const voteMutation = useMutation({
    ...trpc.bounties.voteBounty.mutationOptions(),
  });

  const handleUpvote = () => {
    const key = trpc.bounties.getBountyVotes.queryKey({ bountyId: bounty.id });
    const previous = queryClient.getQueryData<{ count: number; isVoted: boolean }>(key);
    const next = previous
      ? { count: previous.isVoted ? Math.max(0, Number(previous.count) - 1) : Number(previous.count) + 1, isVoted: !previous.isVoted }
      : { count: 1, isVoted: true };
    queryClient.setQueryData(key, next);
    voteMutation.mutate(
      { bountyId: bounty.id },
      {
        onError: () => {
          if (previous) queryClient.setQueryData(key, previous);
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      },
    );
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      /*className="cursor-pointer bountyCard flex w-full flex-col items-start gap-3 rounded-lg bg-[#1D1D1D] p-6 hover:bg-[#2A2A28] transition-colors  */
      className="cursor-pointer flex w-full flex-col items-start gap-3 rounded-lg bg-[#191919] p-6 transition duration-100 ease-out active:scale-[.98] border border-[#383838]/20"
      tabIndex={0}
      role="button"
      aria-label={`View bounty: ${bounty.title}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={bounty.creator.image || ""}
              alt={bounty.creator.name || ""}
            />
            <AvatarFallback>{creatorInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {creatorName}
              </span>
              <div className="w-4 h-4 bg-blue-500 rounded transform rotate-45 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white transform -rotate-45" />
              </div>
            </div>
            <span className="text-xs text-gray-400 capitalize">
              {bounty.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UpvoteButton
            isVoted={votes.data?.isVoted ?? false}
            voteCount={votes.data?.count ?? 0}
            onUpvote={handleUpvote}

          />
          <BookmarkButton bountyId={bounty.id} />
          <span className="text-sm font-semibold text-green-400">
            ${formatLargeNumber(bounty.amount)}
          </span>
        </div>
      </div>

      <div className="w-full">
        <h3 className="text-base font-medium text-white mb-2 line-clamp-2">
          {bounty.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-3">
          {bounty.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <time
            dateTime={bounty.createdAt}
            title={new Date(bounty.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(bounty.createdAt), { addSuffix: true })}
          </time>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span>
            {comments.data?.length ?? 0} {comments.data?.length === 1 ? "comment" : "comments"}
          </span>
        </div>
      </div>
    </div>
  );
});
