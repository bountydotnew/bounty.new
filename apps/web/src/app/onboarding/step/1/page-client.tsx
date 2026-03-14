'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/utils/convex';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const waitlistData = useQuery(api.functions.onboarding.checkWaitlist);
  const isLoadingWaitlist = waitlistData === undefined;

  // Claim the discount in background if on waitlist (don't show the code)
  const claimDiscount = useMutation(
    api.functions.onboarding.claimWaitlistDiscount
  );

  const completeStep = useMutation(api.functions.onboarding.completeStep);

  // Claim discount if on waitlist
  useEffect(() => {
    if (waitlistData?.isOnWaitlist === true) {
      claimDiscount();
    }
  }, [waitlistData?.isOnWaitlist, claimDiscount]);

  const isLoading = isLoadingWaitlist;

  const handleCompleteStep = async () => {
    setIsPending(true);
    try {
      await completeStep({ step: 1 });
      router.push('/onboarding/step/2');
    } finally {
      setIsPending(false);
    }
  };

  // Note: Server-side redirect in page.tsx handles the waitlist skip to step 2

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#929292] border-t-transparent" />
      </div>
    );
  }

  // Not on waitlist - skip
  if (waitlistData?.isOnWaitlist === false) {
    return null;
  }

  // On waitlist - show welcome message (no promo code)
  return (
    <OnboardingDialog
      open
      title="Welcome to Bounty!"
      subtitle="You're on the waitlist! Let's get you set up."
      isLoading={isPending}
      actionLabel="Continue"
      onAction={handleCompleteStep}
      skipLabel="Skip"
      onSkip={handleCompleteStep}
    >
      <div className="w-full text-center text-sm text-text-tertiary">
        We've added a 20% discount to your account for the Pro plan.
      </div>
    </OnboardingDialog>
  );
}
