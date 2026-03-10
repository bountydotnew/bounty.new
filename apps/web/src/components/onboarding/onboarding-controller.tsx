'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TourProvider, useTour } from '@bounty/ui/components/tour';
import { buildOnboardingTour } from '@/lib/onboarding-tours';
import { OnboardingTourIntro } from '@/components/onboarding/onboarding-tour-intro';
import { useSession } from '@/context/session-context';
import { useActiveOrg } from '@/hooks/use-active-org';
import { trpc } from '@/utils/trpc';

/**
 * OnboardingController
 *
 * Wraps children with TourProvider and manages the onboarding tour lifecycle:
 * 1. Checks if the user has completed onboarding
 * 2. Shows intro dialog for new users
 * 3. On "Let's go" → starts the tour
 * 4. On "Skip" or tour complete → marks onboarding as done
 */
export function OnboardingController({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { activeOrgSlug } = useActiveOrg();
  const queryClient = useQueryClient();

  const tours = useMemo(
    () => [buildOnboardingTour(activeOrgSlug || 'dashboard')],
    [activeOrgSlug]
  );

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

  const handleTourComplete = useCallback(
    (tourId: string) => {
      if (tourId === 'onboarding') {
        completeOnboarding.mutate();
      }
    },
    [completeOnboarding]
  );

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

  const shouldAutoStartTour =
    !showIntro &&
    userDismissedIntro &&
    !isLoading &&
    onboardingState &&
    !onboardingState.completedOnboarding;

  return (
    <TourProvider
      tours={tours}
      onTourComplete={handleTourComplete}
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

      {/* Bridge: starts tour when intro is dismissed via "Let's go" */}
      {shouldAutoStartTour && (
        <TourAutoStarter orgSlug={activeOrgSlug || 'dashboard'} />
      )}
    </TourProvider>
  );
}

/**
 * Tiny inner component that has access to TourContext and auto-starts the onboarding tour.
 */
function TourAutoStarter({ orgSlug }: { orgSlug: string }) {
  const tour = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started || tour.isActive) return;

    // Navigate to payments page with settings tab first, then start tour
    const paymentsPath = `/${orgSlug}/settings/payments?tab=settings`;
    if (!pathname?.includes('/settings/payments')) {
      router.push(paymentsPath);
    }

    // Delay to allow navigation + render
    const timer = setTimeout(() => {
      tour.start('onboarding');
      setStarted(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [started, tour.isActive, orgSlug, pathname, router, tour]);

  return null;
}
