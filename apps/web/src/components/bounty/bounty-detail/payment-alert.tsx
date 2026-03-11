'use client';

import { use } from 'react';
import { Button } from '@bounty/ui/components/button';
import { BountyDetailContext } from './context';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useActiveOrg } from '@/hooks/use-active-org';
import { StripeDashIcon } from '@bounty/ui/components/icons/huge/stripe';
import { CardIcon } from '@bounty/ui/components/icons/huge/card';

/**
 * BountyDetailPaymentAlert
 *
 * Displays payment status alerts for the bounty.
 * Shows as a collapsible "problems to resolve" indicator.
 * Each problem renders as its own independent item.
 */
export function BountyDetailPaymentAlert() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error(
      'BountyDetailPaymentAlert must be used within BountyDetailProvider'
    );
  }

  const { state, actions, meta } = context;
  const { needsPayment, needsConnectSetup } = state;
  const { orgUrl } = useActiveOrg();
  const [isExpanded, setIsExpanded] = useState(false);

  let problemCount = 0;
  if (needsPayment) {
    problemCount++;
  }
  if (needsConnectSetup) {
    problemCount++;
  }

  if (problemCount === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <AnimatePresence>
        {isExpanded ? (
          <m.div
            key="expanded"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{
              opacity: 0,
              scale: 0.98,
              height: 0,
              transition: { duration: 0.15 },
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2 overflow-hidden"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-foreground text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>
                  {problemCount} problem{problemCount !== 1 ? 's' : ''} to
                  resolve
                </span>
              </div>
              <ChevronUp className="w-4 h-4 shrink-0" />
            </button>

            {/* Problem items — each is its own card */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {needsPayment && (
                <div className="rounded-lg border border-border-subtle bg-surface-2 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <CardIcon className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <p className="text-sm text-foreground">
                        This bounty needs to be funded before it can accept
                        submissions.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => actions.completePayment()}
                          disabled={
                            meta.isCreatingPayment ||
                            state.isPaymentStatusLoading
                          }
                          size="sm"
                        >
                          {meta.isCreatingPayment
                            ? 'Preparing...'
                            : 'Fund Bounty'}
                        </Button>
                        <Button
                          onClick={() => actions.recheckPayment()}
                          disabled={
                            meta.isRecheckingPayment ||
                            state.isPaymentStatusLoading
                          }
                          size="sm"
                          variant="outline"
                        >
                          {meta.isRecheckingPayment ? 'Checking...' : 'Sync'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {needsConnectSetup && (
                <div className="rounded-lg border border-border-subtle bg-surface-2 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <StripeDashIcon className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <p className="text-sm text-foreground">
                        Set up Stripe Connect to earn from this bounty.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => actions.setupConnect()}
                          disabled={meta.isSettingUpConnect}
                          size="sm"
                        >
                          {meta.isSettingUpConnect
                            ? 'Loading...'
                            : 'Set up Stripe'}
                        </Button>
                        <Button
                          onClick={() => {
                            window.location.href = orgUrl('/settings/payments');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Payment Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          </m.div>
        ) : (
          <m.button
            type="button"
            key="collapsed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-foreground text-sm font-medium hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>
                {problemCount} problem{problemCount !== 1 ? 's' : ''} to resolve
              </span>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}
