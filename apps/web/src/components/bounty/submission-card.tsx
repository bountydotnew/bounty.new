import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, GitMerge, Loader2 } from 'lucide-react';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { Badge } from '@/components/bounty/badge';

interface SubmissionCardProps {
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
  // Merge action
  canMerge?: boolean;
  isMerging?: boolean;
  onMerge?: () => void;
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
  canMerge,
  isMerging,
  onMerge,
}: SubmissionCardProps) {
  // Use GitHub username if available, otherwise fallback to contributor name or user
  const displayName = username || contributorName || user || 'Anonymous';
  const displayAvatar = avatarSrc || contributorImage || '';

  // Build PR URL if we have the PR number and repo info
  const prUrl =
    pullRequestUrl ||
    (githubPullRequestNumber && githubRepoOwner && githubRepoName
      ? `https://github.com/${githubRepoOwner}/${githubRepoName}/pull/${githubPullRequestNumber}`
      : deliverableUrl);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    approved: 'bg-green-500/15 text-green-600 dark:text-green-400',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
    revision_requested: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
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
        'flex w-full flex-col items-start gap-3 rounded-lg border border-border-subtle bg-surface-2 p-4',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${username || displayName}`}
            className="shrink-0"
          >
            <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
              <AvatarImage alt={displayName} src={displayAvatar} />
              <AvatarFacehash name={displayName} size={40} />
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Link
                href={`/profile/${username || displayName}`}
                className="font-medium text-sm text-foreground hover:underline"
              >
                {displayName}
              </Link>
              {hasBadge && <Badge />}
            </div>
            <div className="flex items-center gap-2">
              {rank && <span className="text-text-muted text-xs">{rank}</span>}
              {status && (
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md',
                    statusColors[status] || 'bg-muted text-text-muted'
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
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <a href={prUrl} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="h-3.5 w-3.5" />
              <span className="font-medium text-sm">
                {githubPullRequestNumber
                  ? `PR #${githubPullRequestNumber}`
                  : 'View'}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        ) : (
          <Button size="sm" className="flex items-center gap-2">
            <GithubIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-sm">Preview</span>
          </Button>
        )}
      </div>
      {description && (
        <p className="text-text-secondary text-sm">{description}</p>
      )}
      {/* Hide image preview for GitHub PR submissions */}
      {!prUrl && previewSrc && (
        <Image
          alt="Theme preview screenshot"
          className="h-20 w-20 rounded-md object-cover"
          src={previewSrc}
        />
      )}
      {canMerge && onMerge && (
        <Button
          onClick={onMerge}
          disabled={isMerging}
          size="sm"
          className="flex w-full items-center justify-center gap-2"
        >
          {isMerging ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GitMerge className="h-3.5 w-3.5" />
          )}
          {isMerging ? 'Merging...' : 'Merge & Pay Out'}
        </Button>
      )}
    </div>
  );
}
