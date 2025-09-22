'use client';

import { Button } from '@bounty/ui/components/button';
import { useState } from 'react';
import { trpc } from '@/utils/trpc'; // Adjust path as needed

interface StripeOnboardingLinkProps {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function StripeOnboardingLink({
  onSuccess,
  onError,
}: StripeOnboardingLinkProps) {
  const [loading, setLoading] = useState(false);
  const getAccountOnboardingLink =
    trpc.profiles.getAccountOnboardingLink.useMutation();

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const { data } = await getAccountOnboardingLink.mutateAsync();
      onSuccess?.(data.url);
      window.location.href = data.url;
    } catch (err) {
      onError?.('Failed to generate onboarding link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} onClick={handleOnboard}>
      {loading ? 'Generating link...' : 'Complete Stripe Onboarding'}
    </Button>
  );
}
