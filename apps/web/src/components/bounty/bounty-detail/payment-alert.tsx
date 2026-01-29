'use client';

import { use } from 'react';
import { Button } from '@bounty/ui/components/button';
import { Alert, AlertDescription } from '@bounty/ui/components/alert';
import { BountyDetailContext } from './context';

/**
 * BountyDetailPaymentAlert
 *
 * Displays payment status alerts for the bounty.
 * Shows alerts for:
 * - Creator needs to complete payment
 * - Non-creators see that the bounty is not yet funded
 * Uses the BountyDetailContext to access payment state.
 */
export function BountyDetailPaymentAlert() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error('BountyDetailPaymentAlert must be used within BountyDetailProvider');
  }

  const { state, actions, meta } = context;
  const { needsPayment, isUnfunded, isCreator } = state;

  // Creator sees payment completion prompt
  if (needsPayment) {
    return (
      <Alert className="mb-4 border-yellow-500/20 bg-yellow-500/10">
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-400">
            This bounty requires payment to become active. Complete payment to
            allow submissions.
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={actions.recheckPayment}
              disabled={meta.isRecheckingPayment || state.isPaymentStatusLoading}
              size="sm"
              variant="outline"
            >
              {meta.isRecheckingPayment ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              onClick={actions.completePayment}
              disabled={meta.isCreatingPayment || state.isPaymentStatusLoading}
              size="sm"
            >
              {meta.isCreatingPayment ? 'Preparing...' : 'Complete Payment'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Non-creators see that bounty is not funded
  if (!isCreator && isUnfunded) {
    return (
      <Alert className="mb-4 border-[#232323] bg-[#191919]">
        <AlertDescription className="text-[#FFFFFF99]">
          This bounty is not yet funded. Submissions may be restricted until
          payment is completed.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
