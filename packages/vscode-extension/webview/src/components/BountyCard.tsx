import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, MessageCircle, ChevronUp, Bookmark } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import type { Bounty } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui';

interface BountyCardProps {
  bounty: Bounty;
  onClick: () => void;
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function BountyCard({ bounty, onClick }: BountyCardProps) {
  const handleClick = onClick;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const creatorName = bounty.creator?.name || 'Anonymous';
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const creatorImage = bounty.creator?.image;
  const amount = (bounty.amount || 0) as number;

  return (
    <div
      aria-label={`View bounty: ${bounty.title}`}
      className="flex w-full cursor-pointer flex-col items-start gap-3 rounded-lg border border-[#383838]/20 bg-[#191919] p-6 transition duration-100 ease-out hover:border-[#383838]/40 active:scale-[.98]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Header with avatar and actions */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage alt={creatorName} src={creatorImage || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {creatorInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white truncate">
                {creatorName}
              </span>
              <div className="flex h-4 w-4 rotate-45 transform items-center justify-center rounded bg-blue-500 flex-shrink-0">
                <Check className="-rotate-45 h-2.5 w-2.5 transform text-white" />
              </div>
            </div>
             <span className="text-gray-400 text-xs capitalize">
              {bounty.status.replaceAll('_', ' ')}
             </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Upvote button */}
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
            type="button"
          >
            <ChevronUp className="h-4 w-4" />
            <span className="text-sm">{bounty.voteCount ?? 0}</span>
          </button>
          {/* Bookmark button */}
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
            type="button"
          >
            <Bookmark className={`h-4 w-4 ${bounty.bookmarked ? 'fill-white text-white' : ''}`} />
          </button>
          {/* Reward */}
          <span className="font-semibold text-green-400 text-sm whitespace-nowrap">
            ${formatLargeNumber(amount)}
          </span>
        </div>
      </div>

      {/* Title and description */}
      <div className="w-full">
        <h3 className="mb-2 line-clamp-2 font-medium text-base text-white">
          {bounty.title}
        </h3>
        <div className="relative text-gray-400 text-sm">
          <div className="max-h-24 overflow-hidden pr-1">
            <div className="line-clamp-3 prose prose-invert prose-sm max-w-none prose-p:my-0 prose-headings:my-0 prose-ul:my-0 prose-ol:my-0">
              <Markdown
                options={{
                  forceBlock: true,
                  overrides: {
                    p: { component: 'p', props: { className: 'inline' } },
                  },
                }}
              >
                {bounty.description || ''}
              </Markdown>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-[#191919]" />
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="mt-auto flex items-center gap-3 text-gray-400 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <Clock aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <time
            dateTime={bounty.createdAt as string}
            title={new Date(bounty.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(bounty.createdAt), {
              addSuffix: true,
            })}
          </time>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <span>{bounty.commentCount ?? 0} {(bounty.commentCount ?? 0) === 1 ? 'comment' : 'comments'}</span>
        </div>
      </div>
    </div>
  );
}
