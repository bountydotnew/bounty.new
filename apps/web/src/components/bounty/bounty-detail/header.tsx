'use client';

import { use } from 'react';
import { formatLargeNumber } from '@bounty/ui/lib/utils';
import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import BountyActions from '@/components/bounty/bounty-actions';
import { AlertTriangle, X } from 'lucide-react';
import type { ActionItem } from '@/types/bounty-actions';
import { BountyDetailContext } from './context';

/**
 * BountyDetailHeader
 *
 * Displays the bounty title, amount, creator info, and action buttons.
 * Uses the BountyDetailContext to access state and actions.
 */
export function BountyDetailHeader() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error('BountyDetailHeader must be used within BountyDetailProvider');
  }

  const { state, actions, meta } = context;

  const {
    bounty: { title, amount, user, avatarSrc, repositoryUrl, issueUrl },
    votes,
    bookmarked,
    canEdit,
    canDelete,
    canRequestCancellation,
    hasPendingCancellation,
    isCancelled,
  } = state;

  // Build cancellation action items
  const cancellationActions: ActionItem[] =
    canRequestCancellation && !isCancelled
      ? [
          hasPendingCancellation
            ? ({
                key: 'cancel-cancellation-request',
                label: 'Cancel cancellation request',
                onSelect: actions.cancelCancellationRequest,
                icon: <X className="h-3.5 w-3.5" />,
                disabled: meta.isCancellingCancellationRequest,
                className:
                  'text-green-500 hover:bg-green-500/10 focus:bg-green-500/10',
              } satisfies ActionItem)
            : ({
                key: 'request-cancellation',
                label: 'Request cancellation',
                onSelect: () => actions.requestCancellation(),
                icon: <AlertTriangle className="h-3.5 w-3.5" />,
                disabled: meta.isRequestingCancellation,
                className:
                  'text-yellow-500 hover:bg-yellow-500/10 focus:bg-yellow-500/10',
              } satisfies ActionItem),
        ]
      : [];

  return (
    <div className="mb-6">
      {/* Title and Amount */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-4xl text-white leading-[120%] tracking-tight">
          {title}
        </h1>
        <span className="font-semibold text-2xl text-green-400">
          ${formatLargeNumber(amount)}
        </span>
      </div>

      {/* User Profile with Actions */}
      <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>{user.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white whitespace-nowrap">
                {user}
              </span>
              <div className="flex h-4 w-4 rotate-45 transform items-center justify-center rounded bg-blue-500">
                <Check className="-rotate-45 h-2.5 w-2.5 transform text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2">
          <BountyActions
            bookmarked={bookmarked}
            bountyId={state.bounty.id}
            canDelete={canDelete}
            canEdit={canEdit}
            isVoted={Boolean(votes?.isVoted)}
            onDelete={canDelete ? actions.delete : undefined}
            onEdit={actions.openEditModal}
            onShare={actions.share}
            onUpvote={actions.upvote}
            repositoryUrl={repositoryUrl}
            issueUrl={issueUrl}
            voteCount={votes?.count ?? 0}
            actions={cancellationActions.length > 0 ? cancellationActions : undefined}
          />
        </div>
      </div>
    </div>
  );
}
