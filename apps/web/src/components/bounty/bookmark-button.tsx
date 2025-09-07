'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@bounty/ui/components/button';
import { orpc } from '@/utils/orpc';

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
    queryKey: ['orpc', 'bounties', 'getBountyBookmark', bountyId],
    queryFn: () => (orpc as any).bounties.getBountyBookmark({ bountyId }),
    enabled: !onToggle,
  });
  const toggle = useMutation({
    mutationFn: (vars: { bountyId: string }) =>
      (orpc as any).bounties.toggleBountyBookmark({ bountyId: vars.bountyId }),
  });

  const handleClick = useCallback(() => {
    if (onToggle) {
      return onToggle();
    }
    const key = ['orpc', 'bounties', 'getBountyBookmark', bountyId] as const;
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
        className={`h-4 w-4 ${bookmarked ? 'fill-white text-white' : ''}`}
      />
    </Button>
  );
}
