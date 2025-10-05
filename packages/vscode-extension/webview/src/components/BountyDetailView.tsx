import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ChevronUp, Bookmark, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import type { BountyDetail } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { Button } from './ui';
import { Check } from 'lucide-react';
import { Spinner } from './ui';
import { useSendMessage, useMessageListener } from '../hooks/useVSCodeMessage';

interface BountyDetailViewProps {
  bountyId: string;
  onBack: () => void;
}

export function BountyDetailView({ bountyId, onBack }: BountyDetailViewProps) {
  const sendMessage = useSendMessage();
  const [bountyDetail, setBountyDetail] = useState<BountyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMessageListener((message) => {
    if (message.type === 'bountyDetailLoaded' && message.bountyDetail) {
      setBountyDetail(message.bountyDetail);
      setLoading(false);
    } else if (message.type === 'error') {
      setError(message.message || 'Failed to load bounty details');
      setLoading(false);
    }
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    sendMessage('fetchBountyDetail', { bountyId });
  }, [bountyId, sendMessage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !bountyDetail) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">{error || 'Bounty not found'}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const { bounty, votes, comments } = bountyDetail;
  
  const creatorName = bounty.creator?.name || 'Anonymous';
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const creatorImage = bounty.creator?.image;
  const amount = (bounty.amount || 0) as number;

  const handleOpenInBrowser = () => {
    sendMessage('openBounty', { bountyId: bounty.id });
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/20">
        <Button
          variant="icon"
          onClick={onBack}
          title="Back to bounties"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-white truncate flex-1">Bounty Details</h1>
        <Button
          variant="icon"
          onClick={handleOpenInBrowser}
          title="Open in browser"
          aria-label="Open in browser"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          {/* Title and Amount */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-bold text-2xl text-white leading-tight">
                {bounty.title}
              </h2>
              <span className="flex-shrink-0 font-semibold text-xl text-green-400">
                ${formatLargeNumber(amount)}
              </span>
            </div>
          </div>

          {/* Creator Info and Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage alt={creatorName} src={creatorImage || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {creatorInitial}
                </AvatarFallback>
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border/20 text-white hover:bg-muted/50 transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="button"
              >
                <ChevronUp className="h-4 w-4" />
                <span>{votes.count}</span>
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border/20 text-white hover:bg-muted/50 transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="button"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border/20 text-white hover:bg-muted/50 transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="button"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* About Section */}
          {bounty.description && (
            <div className="rounded-lg border border-border/20 bg-[#1D1D1D] p-5 space-y-3">
              <h3 className="font-medium text-white text-lg">About</h3>
              <div className="text-gray-400 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2">
                <Markdown>{bounty.description}</Markdown>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <div className="flex items-center gap-1">
              <span>Status:</span>
              <span className="text-white capitalize">
                {bounty.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Created:</span>
              <time
                dateTime={bounty.createdAt as string}
                title={new Date(bounty.createdAt).toLocaleString()}
              >
                {formatDistanceToNow(new Date(bounty.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>

          {/* Comments Section */}
          <div className="rounded-lg border border-border/20 bg-[#1D1D1D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white text-lg">Comments</h3>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length}</span>
              </div>
            </div>

            {/* Disabled comment input */}
            <div className="relative">
              <textarea
                className="w-full rounded-md border border-border/20 bg-[#0D0D0D] px-4 py-3 text-sm text-gray-500 cursor-not-allowed resize-none"
                placeholder="View this bounty on bounty.new to leave a comment..."
                rows={3}
                disabled
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-transparent to-[#1D1D1D]/20 pointer-events-none" />
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No comments yet. View on bounty.new to be the first to comment!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-t border-border/20 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage alt={comment.user.name || 'User'} src={comment.user.image || ''} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {(comment.user.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-white">
                            {comment.user.name || 'Anonymous'}
                          </span>
                          <time className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </time>
                        </div>
                        <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none prose-p:my-1">
                          <Markdown>{comment.content}</Markdown>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                            type="button"
                          >
                            <ChevronUp className="h-3 w-3" />
                            <span>{comment.likeCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Section */}
          <div className="rounded-lg border border-border/20 bg-[#1D1D1D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white text-lg">Submissions</h3>
              <Button className="text-sm">
                View all
              </Button>
            </div>
            <div className="text-center py-8 text-gray-400 text-sm">
              No submissions yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
