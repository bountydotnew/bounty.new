'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/** Map tour IDs to their corresponding task keys for DB persistence */
const TOUR_TO_TASK: Record<string, 'tools' | 'payouts' | 'bounty' | 'member'> =
  {
    'connect-tools': 'tools',
    'setup-payouts': 'payouts',
    'create-bounty': 'bounty',
    'invite-member': 'member',
  };

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

  const queryClient = useQueryClient();

  const { data: onboardingState } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isAuthenticated,
  });

  const completeTask = useMutation(
    trpc.onboarding.completeGettingStartedTask.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['onboarding', 'getState']],
        });
      },
    })
  );

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  const handleTourComplete = useCallback(
    (tourId: string) => {
      // Mark the task as complete when the tour finishes (last step "Finish"
      // button) or when the user skips (dismiss). This is the ONLY place
      // tasks get marked complete — not on checklist item click.
      const taskKey = TOUR_TO_TASK[tourId];
      if (taskKey) {
        completeTask.mutate({ task: taskKey });
      }

      // Check if all tasks are now complete (count the ones already done
      // plus this one we just completed)
      if (onboardingState) {
        const alreadyCompleted = [
          onboardingState.connectedTools,
          onboardingState.setupPayouts,
          onboardingState.createdBounty,
          onboardingState.invitedMember,
        ].filter(Boolean).length;

        // +1 for the task we just completed (if it wasn't already)
        const taskField = taskKey
          ? {
              tools: 'connectedTools',
              payouts: 'setupPayouts',
              bounty: 'createdBounty',
              member: 'invitedMember',
            }[taskKey]
          : null;
        const wasAlreadyDone = taskField
          ? onboardingState[taskField as keyof typeof onboardingState]
          : false;
        const total = alreadyCompleted + (wasAlreadyDone ? 0 : 1);

        if (total >= TOTAL_TASKS) {
          setShowCompletion(true);
        }
      }
    },
    [onboardingState, completeTask]
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
