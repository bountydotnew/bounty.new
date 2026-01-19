'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data: waitlistData, isLoading: isLoadingWaitlist } = useQuery({
    queryKey: ['onboarding.checkWaitlist'],
    queryFn: () => trpcClient.onboarding.checkWaitlist.query(),
  });

  const { data: couponData } = useQuery({
    queryKey: ['onboarding.claimWaitlistDiscount'],
    queryFn: () => trpcClient.onboarding.claimWaitlistDiscount.mutate(),
    enabled: waitlistData?.isOnWaitlist === true,
  });

  const completeStepMutation = useMutation({
    mutationFn: () => trpcClient.onboarding.completeStep.mutate({ step: 1 }),
    onSuccess: () => {
      router.push('/onboarding/step/2');
    },
  });

  const handleCopyCoupon = () => {
    if (couponData?.code) {
      navigator.clipboard.writeText(couponData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading = isLoadingWaitlist;

  // If not on waitlist, skip to step 2
  useEffect(() => {
    if (!isLoadingWaitlist && waitlistData?.isOnWaitlist === false) {
      router.push('/onboarding/step/2');
    }
  }, [isLoadingWaitlist, waitlistData, router]);

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

  // On waitlist - show discount
  return (
    <OnboardingDialog
      open
      title="20% off Pro"
      subtitle="Here's your waitlist discount"
      isLoading={completeStepMutation.isPending}
      actionLabel="Continue"
      onAction={() => completeStepMutation.mutate()}
      skipLabel="Skip"
      onSkip={() => completeStepMutation.mutate()}
    >
      {couponData?.code && (
        <div className="w-full">
          <button
            onClick={handleCopyCoupon}
            className="w-full flex items-center justify-between gap-3 bg-[#0E0E0E] border border-[#333] rounded-md px-4 py-3 hover:border-[#444] transition-colors focus:outline-none focus-visible:outline-none"
          >
            <span className="font-mono text-[#F2F2DD]">
              {couponData.code}
            </span>
            <span className="w-20 text-right text-xs text-[#929292]">
              {copied ? (
                <span className="text-green-500">Copied!</span>
              ) : (
                'Click to copy'
              )}
            </span>
          </button>
        </div>
      )}
    </OnboardingDialog>
  );
}
