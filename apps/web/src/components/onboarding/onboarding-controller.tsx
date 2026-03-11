'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TourProvider } from '@bounty/ui/components/tour';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { buildOnboardingTours } from '@/lib/onboarding-tours';
import { useSession } from '@/context/session-context';
import { GettingStartedFloat } from '@/components/onboarding/getting-started-float';
import { trpc } from '@/utils/trpc';

const TOTAL_TASKS = 4;

/**
 * OnboardingController
 *
 * Wraps children with TourProvider for the getting-started tour system.
 * Tours are triggered by the Getting Started sidebar card (or the floating
 * bar on settings pages). No auto-start, no intro dialog.
 *
 * When all 4 getting-started tasks are complete and the user finishes
 * the last tour, a completion dialog is shown.
 */
export function OnboardingController({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const [showCompletion, setShowCompletion] = useState(false);

  const tours = useMemo(() => buildOnboardingTours(), []);

  const { data: onboardingState } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isAuthenticated,
  });

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  const handleTourComplete = useCallback(
    (_tourId: string) => {
      // The task was marked complete before the tour started (in the
      // checklist click handler), so onboardingState should already
      // reflect it by the time the user clicks through the tour steps.
      if (!onboardingState) return;

      const completed = [
        onboardingState.connectedTools,
        onboardingState.setupPayouts,
        onboardingState.createdBounty,
        onboardingState.invitedMember,
      ].filter(Boolean).length;

      if (completed >= TOTAL_TASKS) {
        setShowCompletion(true);
      }
    },
    [onboardingState]
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <TourProvider
      tours={tours}
      onNavigate={handleNavigate}
      onTourComplete={handleTourComplete}
    >
      {children}
      <GettingStartedFloat />
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent showCloseButton={false} showBackdrop={false}>
          <DialogHeader>
            <DialogTitle>You're all set!</DialogTitle>
            <DialogDescription>
              You've completed the getting started guide. You're ready to start
              creating and managing bounties.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletion(false)}>
              Stay here
            </Button>
            <Button
              onClick={() => {
                setShowCompletion(false);
                router.push('/dashboard');
              }}
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TourProvider>
  );
}
