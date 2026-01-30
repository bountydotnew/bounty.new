'use client';

import { useContext } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';

import { SubmissionsPeopleIcon, GithubIcon, LinearIcon } from '@bounty/ui';
import { BountyCardContext } from './context';

interface BaseBountyCardProps {
  compact: boolean;
}

/**
 * Base BountyCard component that handles the card rendering.
 * Used by both CompactBountyCard and StandardBountyCard variants.
 */
export function BaseBountyCard({ compact }: BaseBountyCardProps) {
  const context = useContext(BountyCardContext);
  if (!context) {
    throw new Error('BaseBountyCard must be used within BountyCardProvider');
  }

  const { state, actions } = context;
  const {
    bounty,
    stats,
    formattedAmount,
    badgeInfo,
    creatorName,
    repoDisplay,
    issueDisplay,
    linearDisplay,
  } = state;
  const {
    handleClick,
  } = actions;

  const submissionCount = stats?.submissionCount ?? 0;

  return (
        <button
          aria-label={`View bounty: ${bounty.title}`}
          className={`flex w-full cursor-pointer flex-col rounded-xl border border-border-subtle bg-surface-1 transition duration-100 ease-out active:scale-[.98] min-w-0 text-left ${compact ? 'gap-1.5 p-2' : 'gap-2.5 p-4 sm:p-5'}`}
          onClick={handleClick}
          type="button"
        >
          {/* Top row: Creator + Amount */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center ${compact ? 'gap-1' : 'gap-[5px]'}`}
            >
              <Avatar className={compact ? 'h-3 w-3' : 'h-4 w-4'}>
                <AvatarImage
                  alt={creatorName}
                  src={bounty.creator.image ?? undefined}
                />
                <AvatarFacehash
                  name={creatorName}
                  size={compact ? 12 : 16}
                  className="rounded-[6px]"
                />
              </Avatar>
              <span
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-normal leading-[150%] text-foreground/60`}
              >
                {creatorName}
              </span>
            </div>
            <div
              className={`flex items-center ${compact ? 'gap-1 px-1' : 'h-5 gap-[5px] px-[3px]'}`}
            >
              <span
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-semibold leading-[150%] text-brand-accent-muted`}
              >
                {formattedAmount}
              </span>
              <span className={badgeInfo.className}>{badgeInfo.label}</span>
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between min-w-0">
            <div
              className={`flex items-center gap-[5px] min-w-0 flex-1 ${compact ? 'h-4' : 'h-[19.5px]'}`}
            >
              <span
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-medium leading-[150%] text-foreground whitespace-normal wrap-break-word min-w-0`}
              >
                {bounty.title}
              </span>
            </div>
          </div>

          {/* Bottom row: Stats + Timestamp */}
          <div
            className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 min-w-0 ${compact ? '' : 'gap-2'}`}
          >
            <div
              className={`flex flex-wrap items-center min-w-0 flex-1 ${compact ? 'gap-1' : 'gap-[6px] sm:gap-[10px]'}`}
            >
              {/* Submissions */}
              <div
                className={`flex h-fit items-center shrink-0 ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
              >
                <div className="flex h-fit items-center opacity-30">
                  <SubmissionsPeopleIcon
                    className={compact ? 'h-3 w-3' : 'h-4 w-4'}
                  />
                </div>
                <span
                  className={`${compact ? 'text-[9px]' : 'text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-foreground/60 whitespace-nowrap`}
                >
                  {submissionCount}{' '}
                  {submissionCount === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {/* Linear or GitHub repo/issue */}
              {linearDisplay ? (
                <a
                  href={linearDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center min-w-0 flex-1 sm:flex-initial hover:bg-surface-hover rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <LinearIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span
                    className={`flex items-center font-normal leading-[150%] text-foreground/60 truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
                  >
                    {linearDisplay.identifier}
                  </span>
                </a>
              ) : issueDisplay ? (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center min-w-0 flex-1 sm:flex-initial hover:bg-surface-hover rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <GithubIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span
                    className={`flex items-center font-normal leading-[150%] text-foreground/60 truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
                  >
                    {issueDisplay.repo}
                  </span>
                </a>
              ) : (
                <div
                  className={
                    'flex h-fit items-center gap-[5px] px-[3px] min-w-0 flex-1 sm:flex-initial'
                  }
                >
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <GithubIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span
                    className={`flex items-center font-normal leading-[150%] text-foreground/60 truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
                  >
                    {repoDisplay}
                  </span>
                </div>
              )}

              {/* GitHub issue link (only if not Linear) */}
              {!linearDisplay && issueDisplay && (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center shrink-0 hover:bg-surface-hover rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`flex items-center font-normal leading-[150%] text-brand-accent-muted whitespace-nowrap ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
                  >
                    #{issueDisplay.number}
                  </span>
                </a>
              )}
            </div>

            {/* Timestamp */}
            <div
              className={`flex h-fit items-center shrink-0 ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
            >
              <span
                className={`${compact ? 'text-[9px]' : 'h-5 text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-foreground/60 whitespace-nowrap`}
              >
                {formatDistanceToNow(new Date(bounty.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </button>
  );
}
