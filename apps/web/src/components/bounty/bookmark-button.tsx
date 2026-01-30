'use client';

import { Button } from '@bounty/ui/components/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { useCallback } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';

interface BookmarkButtonProps {
  bountyId: string;
  className?: string;
  bookmarked?: boolean;
  onToggle?: () => void;
}

export default function BookmarkButton({
  bountyId,
  className,
  bookmarked: controlledBookmarked,
  onToggle,
}: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const bookmarkQuery = useQuery({
    ...trpc.bounties.getBountyBookmark.queryOptions({ bountyId }),
    enabled: !onToggle,
  });
  const toggle = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.toggleBountyBookmark.mutate(input);
    },
  });

  const handleClick = useCallback(() => {
    if (onToggle) {
      return onToggle();
    }
    const key = trpc.bounties.getBountyBookmark.queryKey({ bountyId });
    const current = bookmarkQuery.data?.bookmarked ?? false;
    queryClient.setQueryData(key, { bookmarked: !current });
    toggle.mutate(
      { bountyId },
      {
        onError: () => {
          queryClient.setQueryData(key, { bookmarked: current });
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      }
    );
  }, [bountyId, bookmarkQuery.data?.bookmarked, onToggle, queryClient, toggle]);

  const bookmarked = onToggle
    ? Boolean(controlledBookmarked)
    : (bookmarkQuery.data?.bookmarked ?? false);

  return (
    <Button
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      aria-pressed={bookmarked}
      className={`rounded-md border border-neutral-700 bg-neutral-800/40 p-1 text-neutral-300 hover:bg-neutral-700/40 ${className ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      size="icon"
      variant="outline"
    >
      <Bookmark
        className={`h-4 w-4 ${bookmarked ? 'fill-white text-foreground' : ''}`}
      />
    </Button>
  );
}
