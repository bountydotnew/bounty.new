import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';
import { ExternalLink, Github } from 'lucide-react';
import { Badge } from '@/components/bounty/badge';

export interface SubmissionCardProps {
  // User info
  user?: string;
  username?: string; // GitHub username
  contributorName?: string;
  contributorImage?: string;
  avatarSrc?: string;
  avatar?: string;
  // Submission data
  description?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  // GitHub PR data
  githubPullRequestNumber?: number | null;
  githubRepoOwner?: string;
  githubRepoName?: string;
  pullRequestUrl?: string;
  deliverableUrl?: string;
  // Display
  rank?: string;
  hasBadge?: boolean;
  previewSrc?: string;
  className?: string;
}

export default function SubmissionCard({
  user,
  username,
  contributorName,
  contributorImage,
  avatarSrc = '',
  rank,
  hasBadge,
  previewSrc = '',
  className,
  description = '',
  status,
  githubPullRequestNumber,
  githubRepoOwner,
  githubRepoName,
  pullRequestUrl,
  deliverableUrl,
}: SubmissionCardProps) {
  // Use GitHub username if available, otherwise fallback to contributor name or user
  const displayName = username || contributorName || user || 'Anonymous';
  const displayAvatar = avatarSrc || contributorImage || '';

  // Build PR URL if we have the PR number and repo info
  const prUrl =
    pullRequestUrl ||
    ((githubPullRequestNumber && githubRepoOwner && githubRepoName)
      ? `https://github.com/${githubRepoOwner}/${githubRepoName}/pull/${githubPullRequestNumber}`
      : deliverableUrl);

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-red-400',
    revision_requested: 'text-orange-400',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    revision_requested: 'Revision Requested',
  };

  return (
    <div
      className={cn(
        'flex w-full min-w-[466px] max-w-[466px] flex-col items-start gap-3 rounded-lg bg-surface-2 p-6 transition-colors hover:bg-surface-hover',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage alt={displayName} src={displayAvatar} />
            <AvatarFacehash name={displayName} size={40} />
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm text-foreground">
                {displayName}
              </span>
              {hasBadge && <Badge />}
            </div>
            <div className="flex items-center gap-2">
              {rank && <span className="text-gray-400 text-xs">{rank}</span>}
              {status && (
                <span
                  className={cn(
                    'text-xs',
                    statusColors[status] || 'text-gray-400'
                  )}
                >
                  {statusLabels[status] || status}
                </span>
              )}
            </div>
          </div>
        </div>
        {prUrl ? (
          <Button
            asChild
            className="flex items-center justify-center gap-2 rounded-lg bg-surface-3 px-3 py-3 text-foreground hover:bg-surface-3"
          >
            <a href={prUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              <span className="font-medium text-sm">
                {githubPullRequestNumber
                  ? `PR #${githubPullRequestNumber}`
                  : 'View'}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        ) : (
          <Button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-foreground dark:text-black">
            <Github className="h-4 w-4 text-foreground dark:text-black" />
            <span className="font-medium text-sm">Preview</span>
          </Button>
        )}
      </div>
      {description && <p className="text-gray-400 text-sm">{description}</p>}
      {/* Hide image preview for GitHub PR submissions */}
      {!prUrl && previewSrc && (
        // eslint-disable-next-line @next/next/no-image-element
        <img
          alt="Theme preview screenshot"
          className="h-20 w-20 rounded-md object-cover"
          src={previewSrc}
        />
      )}
    </div>
  );
}
