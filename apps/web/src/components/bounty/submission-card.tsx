import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { Badge } from '@/components/bounty/badge';

interface SubmissionCardProps {
  // User info
  user?: string;
  username?: string;
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
  pullRequestTitle?: string | null;
  githubHeadSha?: string | null;
  deliverableUrl?: string;
  // Display
  rank?: string;
  hasBadge?: boolean;
  previewSrc?: string;
  className?: string;
  // Actions
  canManage?: boolean;
  isApproving?: boolean;
  isUnapproving?: boolean;
  isMerging?: boolean;
  onApprove?: () => void;
  onUnapprove?: () => void;
  onMerge?: () => void;
  mergeLabel?: string;
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
  pullRequestTitle,
  githubHeadSha,
  deliverableUrl,
  canManage,
  isApproving,
  isUnapproving,
  isMerging,
  onApprove,
  onUnapprove,
  onMerge,
  mergeLabel = 'Pay Out',
}: SubmissionCardProps) {
  const displayName = username || contributorName || user || 'Anonymous';
  const displayAvatar = avatarSrc || contributorImage || '';

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

  const isApproved = status === 'approved';

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
        <div className="flex items-center gap-2">
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
                    ? `#${githubPullRequestNumber}`
                    : 'View'}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ) : previewSrc ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <a
                href={/^https?:\/\//.test(previewSrc) ? previewSrc : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <span className="font-medium text-sm">Preview</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ) : null}
          {canManage && !isApproved && onApprove && (
            <Button
              onClick={onApprove}
              disabled={isApproving}
              size="sm"
              className="flex items-center gap-1.5"
            >
              {isApproving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          )}
          {canManage && isApproved && (
            <>
              {onMerge && (
                <Button
                  onClick={onMerge}
                  disabled={isMerging}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  {isMerging ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isMerging ? 'Processing...' : mergeLabel}
                </Button>
              )}
              {onUnapprove && (
                <Button
                  onClick={onUnapprove}
                  disabled={isUnapproving}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 text-text-secondary"
                >
                  {isUnapproving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {isUnapproving ? 'Revoking...' : 'Unapprove'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* PR Title with inline commit chip */}
      <div className="flex items-center gap-2 flex-wrap">
        {pullRequestTitle && prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-foreground hover:underline"
          >
            {pullRequestTitle}
          </a>
        )}
        {githubHeadSha && (
          <a
            href={githubRepoOwner && githubRepoName && githubPullRequestNumber
              ? `https://github.com/${githubRepoOwner}/${githubRepoName}/pull/${githubPullRequestNumber}/commits/${githubHeadSha}`
              : prUrl || '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#232323] bg-[oklab(28.5%_0_0/32%)] px-1.5 py-0.5 transition-colors hover:bg-[oklab(28.5%_0_0/40%)]"
          >
            <GithubIcon className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs text-text-muted">
              {githubHeadSha.slice(0, 7)}
            </span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-muted" />
          </a>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-text-secondary text-sm">{description}</p>
      )}

      {!prUrl && previewSrc && (
        <Image
          alt="Theme preview screenshot"
          className="h-20 w-20 rounded-md object-cover"
          src={previewSrc}
        />
      )}
    </div>
  );
}
