'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';

export default function OnboardingStep1Page() {
  const router = useRouter();
  const claimedRef = useRef(false);

  const { data: waitlistData, isLoading: isLoadingWaitlist } = useQuery({
    queryKey: ['onboarding.checkWaitlist'],
    queryFn: () => trpcClient.onboarding.checkWaitlist.query(),
  });

  // Claim the discount in background if on waitlist (don't show the code)
  const claimDiscountMutation = useMutation({
    mutationFn: () => trpcClient.onboarding.claimWaitlistDiscount.mutate(),
  });

  const completeStepMutation = useMutation({
    mutationFn: () => trpcClient.onboarding.completeStep.mutate({ step: 1 }),
    onSuccess: () => {
      router.push('/onboarding/step/2');
    },
  });

  // Claim discount once when waitlist data shows user is on waitlist
  // Render-time side-effect: fires mutation once based on query result
  if (waitlistData?.isOnWaitlist === true && !claimedRef.current) {
    claimedRef.current = true;
    claimDiscountMutation.mutate();
  }

  const isLoading = isLoadingWaitlist;

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
      isLoading={completeStepMutation.isPending}
      actionLabel="Continue"
      onAction={() => completeStepMutation.mutate()}
      skipLabel="Skip"
      onSkip={() => completeStepMutation.mutate()}
    >
      <div className="w-full text-center text-sm text-text-tertiary">
        We've added a 20% discount to your account for the Pro plan.
      </div>
    </OnboardingDialog>
  );
}
