'use client';

import { useContext } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@bounty/ui/components/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';

import { Textarea } from '@bounty/ui/components/textarea';
import { SubmissionsPeopleIcon, GithubIcon } from '@bounty/ui';
import { Pin, PinOff, Trash2, AlertTriangle, XCircle } from 'lucide-react';
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

  const { state, actions, meta } = context;
  const {
    bounty,
    stats,
    canPin,
    canDelete,
    canRequestCancellation,
    hasPendingCancellation,
    isCancelled,
    isRefunded,
    formattedAmount,
    badgeInfo,
    creatorName,
    creatorInitial,
    avatarColor,
    repoDisplay,
    issueDisplay,
    isTogglePinPending,
    isDeletePending,
    isRequestCancellationPending,
    isCancelCancellationRequestPending,
  } = state;
  const {
    handleClick,
    togglePin,
    openDeleteDialog,
    confirmDelete,
    cancelDelete,
    openCancellationDialog,
    confirmCancellation,
    cancelCancellationRequest,
  } = actions;
  const {
    showDeleteDialog,
    showCancellationDialog,
    cancellationReason,
    setCancellationReason,
  } = meta;

  const submissionCount = stats?.submissionCount ?? 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          aria-label={`View bounty: ${bounty.title}`}
          className={`flex w-full cursor-pointer flex-col rounded-xl border border-[#232323] bg-[#191919] shadow-[0px_2px_3px_#00000033] transition duration-100 ease-out active:scale-[.98] min-w-0 text-left ${compact ? 'gap-1.5 p-2' : 'gap-2.5 p-4 sm:p-5'}`}
          onClick={handleClick}
          type="button"
        >
          {/* Top row: Creator + Amount */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center ${compact ? 'gap-1' : 'gap-[5px]'}`}
            >
              {bounty.creator.image ? (
                <Avatar className={compact ? 'h-3 w-3' : 'h-4 w-4'}>
                  <AvatarImage alt={creatorName} src={bounty.creator.image} />
                  <AvatarFallback
                    className={
                      compact ? 'h-3 w-3 text-[6px]' : 'h-4 w-4 text-[8px]'
                    }
                  >
                    {creatorInitial}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={`flex items-center justify-center rounded-[6px] leading-[150%] text-white shadow-[inset_0px_2px_3px_#00000033] ${compact ? 'h-3 w-3 text-[6px]' : 'h-4 w-4 text-[8px]'}`}
                  style={{
                    backgroundColor: avatarColor.bg,
                    outline: `1px solid ${avatarColor.border}`,
                    outlineOffset: '-1px',
                  }}
                >
                  {creatorInitial}
                </div>
              )}
              <span
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99]`}
              >
                {creatorName}
              </span>
            </div>
            <div
              className={`flex items-center ${compact ? 'gap-1 px-1' : 'h-5 gap-[5px] px-[3px]'}`}
            >
              <span
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-semibold leading-[150%] text-[#6CFF0099]`}
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
                className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-medium leading-[150%] text-white whitespace-normal wrap-break-word min-w-0`}
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
                  className={`${compact ? 'text-[9px]' : 'text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap`}
                >
                  {submissionCount}{' '}
                  {submissionCount === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {/* GitHub repo */}
              {issueDisplay ? (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center min-w-0 flex-1 sm:flex-initial hover:bg-[#2A2A28] rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <GithubIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span
                    className={`flex items-center font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
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
                    className={`flex items-center font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
                  >
                    {repoDisplay}
                  </span>
                </div>
              )}

              {/* GitHub issue link */}
              {issueDisplay && (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center shrink-0 hover:bg-[#2A2A28] rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`flex items-center font-normal leading-[150%] text-[#6CFF0099] whitespace-nowrap ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}
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
                className={`${compact ? 'text-[9px]' : 'h-5 text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap`}
              >
                {formatDistanceToNow(new Date(bounty.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      {(meta.onDelete || canPin) && (
        <ContextMenuContent className="w-56 rounded-md border border-[#232323] bg-[#191919] text-[#CFCFCF] shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]">
          {canPin && (
            <ContextMenuItem
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
              onClick={togglePin}
              disabled={isTogglePinPending}
            >
              {bounty.isFeatured ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin bounty
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin bounty
                </>
              )}
            </ContextMenuItem>
          )}
          {canDelete && (
            <ContextMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={openDeleteDialog}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete bounty
            </ContextMenuItem>
          )}
          {canRequestCancellation && !isCancelled && !isRefunded && (
            <>
              {hasPendingCancellation ? (
                <ContextMenuItem
                  className="cursor-pointer text-green-500 focus:text-green-500 focus:bg-green-500/10"
                  onClick={cancelCancellationRequest}
                  disabled={isCancelCancellationRequestPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel cancellation request
                </ContextMenuItem>
              ) : (
                <ContextMenuItem
                  className="cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10"
                  onClick={openCancellationDialog}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Request cancellation
                </ContextMenuItem>
              )}
            </>
          )}
        </ContextMenuContent>
      )}
      <Dialog open={showDeleteDialog} onOpenChange={meta.setShowDeleteDialog}>
        <DialogContent className="max-w-[340px] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Trash2 className="h-4 w-4 text-[#888]" />
              Delete Bounty
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#888] mt-3 leading-relaxed">
              Are you sure you want to delete "{bounty.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelDelete}
              className="px-4 py-1.5 text-[14px] font-medium text-[#888] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!canDelete || isDeletePending}
              className="px-4 py-1.5 text-[14px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeletePending ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCancellationDialog}
        onOpenChange={meta.setShowCancellationDialog}
      >
        <DialogContent className="max-w-[340px] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-[#888]" />
              Request Cancellation
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#888] mt-3 leading-relaxed">
              Request to cancel this funded bounty. Our team will review your
              request and process a refund. Note: The platform fee is
              non-refundable.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[80px] border-[#2a2a2a] bg-[#0f0f0f] text-white text-[14px] placeholder:text-[#666] rounded-lg"
            />
          </div>
          <DialogFooter className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => meta.setShowCancellationDialog(false)}
              className="px-4 py-1.5 text-[14px] font-medium text-[#888] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={isRequestCancellationPending}
              className="px-4 py-1.5 text-[14px] font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRequestCancellationPending
                ? 'Submitting...'
                : 'Submit Request'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
}
