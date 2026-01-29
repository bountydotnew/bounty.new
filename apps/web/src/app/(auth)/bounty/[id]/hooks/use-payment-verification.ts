'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { trpcClient } from '@/utils/trpc';

export interface UsePaymentVerificationProps {
  payment: string | null;
  sessionId: string | null;
  bountyId: string | null;
}

export function usePaymentVerification({
  payment,
  sessionId,
  bountyId,
}: UsePaymentVerificationProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasVerifiedRef = useRef(false);

  const verifyPaymentMutation = useMutation({
    mutationFn: async (input: { sessionId: string }) => {
      return await trpcClient.bounties.verifyCheckoutPayment.mutate(input);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.message || 'Payment verified! Your bounty is now live.'
        );
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyDetail']],
        });
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyPaymentStatus']],
        });
      } else {
        toast.info(
          result.message || 'Payment is being processed. Please wait...'
        );
      }
    },
    onError: (error: Error) => {
      console.error('Payment verification error:', error);
      toast.error(`Failed to verify payment: ${error.message}`);
    },
  });

  useEffect(() => {
    if (payment === 'success' && sessionId && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      verifyPaymentMutation.mutate({ sessionId });
      router.replace(`/bounty/${bountyId}`);
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled. You can complete payment later.');
      router.replace(`/bounty/${bountyId}`);
    }
  }, [payment, sessionId, bountyId, router, verifyPaymentMutation]);

  return {
    isVerifying: verifyPaymentMutation.isPending,
  };
}
