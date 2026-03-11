'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TourProvider } from '@bounty/ui/components/tour';
import { buildOnboardingTours } from '@/lib/onboarding-tours';
import { useSession } from '@/context/session-context';
import { GettingStartedFloat } from '@/components/onboarding/getting-started-float';

/**
 * OnboardingController
 *
 * Wraps children with TourProvider for the getting-started tour system.
 * Tours are triggered by the Getting Started sidebar card (or the floating
 * bar on settings pages). No auto-start, no intro dialog.
 */
export function OnboardingController({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useSession();

  const tours = useMemo(() => buildOnboardingTours(), []);

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <TourProvider tours={tours} onNavigate={handleNavigate}>
      {children}
      <GettingStartedFloat />
    </TourProvider>
  );
}
