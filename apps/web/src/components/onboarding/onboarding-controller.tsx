'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TourProvider } from '@bounty/ui/components/tour';
import { buildOnboardingTours } from '@/lib/onboarding-tours';
import { OnboardingTourIntro } from '@/components/onboarding/onboarding-tour-intro';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';

/**
 * OnboardingController
 *
 * Wraps children with TourProvider and manages the onboarding intro dialog.
 * Tours are NOT auto-started — they are triggered by the Getting Started card
 * items in the sidebar. The controller just:
 * 1. Provides TourProvider with all available tours
 * 2. Shows the intro dialog for new users who haven't completed onboarding
 * 3. On "Skip" → marks onboarding as done (hides intro permanently)
 * 4. On "Let's go" → dismisses intro (user can explore via sidebar card)
 */
export function OnboardingController({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  const tours = useMemo(() => buildOnboardingTours(), []);

  const { data: onboardingState, isLoading } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isAuthenticated,
  });

  const completeOnboarding = useMutation(
    trpc.onboarding.completeOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['onboarding', 'getState']],
        });
      },
    })
  );

  const [showIntro, setShowIntro] = useState(false);
  const [userDismissedIntro, setUserDismissedIntro] = useState(false);

  // Show intro dialog when authenticated user hasn't completed onboarding
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      onboardingState &&
      !onboardingState.completedOnboarding &&
      !userDismissedIntro
    ) {
      setShowIntro(true);
    }
  }, [isAuthenticated, isLoading, onboardingState, userDismissedIntro]);

  const handleSkip = useCallback(() => {
    setShowIntro(false);
    setUserDismissedIntro(true);
    completeOnboarding.mutate();
  }, [completeOnboarding]);

  const handleStartTour = useCallback(() => {
    setShowIntro(false);
    setUserDismissedIntro(true);
  }, []);

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  // Don't render tour infra for unauthenticated users
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <TourProvider
      tours={tours}
      onNavigate={handleNavigate}
    >
      {children}

      {/* Intro dialog */}
      <OnboardingTourIntro
        open={showIntro}
        onSkip={handleSkip}
        onStart={handleStartTour}
        isLoading={completeOnboarding.isPending}
      />
    </TourProvider>
  );
}
