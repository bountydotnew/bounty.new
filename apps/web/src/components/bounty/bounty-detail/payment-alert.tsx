'use client';

import { use } from 'react';
import { Button } from '@bounty/ui/components/button';
import { BountyDetailContext } from './context';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';

/**
 * BountyDetailPaymentAlert
 *
 * Displays payment status alerts for the bounty.
 * Shows as a collapsible "problems to resolve" indicator.
 */
export function BountyDetailPaymentAlert() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error('BountyDetailPaymentAlert must be used within BountyDetailProvider');
  }

  const { state, actions, meta } = context;
  const { needsPayment } = state;
  const [isExpanded, setIsExpanded] = useState(false);

  // Count the number of problems
  const problemCount = (needsPayment ? 1 : 0);

  // No problems - don't render anything
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
            exit={{ opacity: 0, scale: 0.98, height: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border border-border-subtle bg-surface-2 rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>{problemCount} problem{problemCount !== 1 ? 's' : ''} to resolve</span>
              </div>
              <m.button
                onClick={() => setIsExpanded(false)}
                className="text-text-muted hover:text-foreground transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </m.button>
            </div>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-4 space-y-3"
            >
              {needsPayment && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-foreground">
                    This bounty requires payment to become active. Complete payment to
                    allow submissions.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => {
                        actions.recheckPayment();
                      }}
                      disabled={meta.isRecheckingPayment || state.isPaymentStatusLoading}
                      size="sm"
                      variant="outline"
                    >
                      {meta.isRecheckingPayment ? 'Syncing...' : 'Sync'}
                    </Button>
                    <Button
                      onClick={() => {
                        actions.completePayment();
                      }}
                      disabled={meta.isCreatingPayment || state.isPaymentStatusLoading}
                      size="sm"
                    >
                      {meta.isCreatingPayment ? 'Preparing...' : 'Complete Payment'}
                    </Button>
                  </div>
                </div>
              )}
            </m.div>
          </m.div>
        ) : (
          <m.button
            key="collapsed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-foreground text-sm font-medium hover:bg-surface-2"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>{problemCount} problem{problemCount !== 1 ? 's' : ''} to resolve</span>
            <ChevronDown className="w-4 h-4" />
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}
