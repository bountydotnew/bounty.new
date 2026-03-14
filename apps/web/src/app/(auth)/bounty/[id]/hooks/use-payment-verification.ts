'use client';

import { useAction } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/utils/convex';

interface UsePaymentVerificationProps {
  payment: string | null;
  sessionId: string | null;
  bountyId: string | null;
}

export function usePaymentVerification({
  payment,
  sessionId,
  bountyId,
}: UsePaymentVerificationProps) {
  const router = useRouter();
  const hasVerifiedRef = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyCheckoutPayment = useAction(
    api.functions.bounties.verifyCheckoutPayment
  );

  useEffect(() => {
    if (payment === 'success' && sessionId && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      setIsVerifying(true);

      verifyCheckoutPayment({ sessionId })
        .then((result) => {
          if (result.success) {
            toast.success(
              result.message || 'Payment verified! Your bounty is now live.'
            );
          } else {
            toast.info(
              result.message || 'Payment is being processed. Please wait...'
            );
          }
        })
        .catch((error: Error) => {
          console.error('Payment verification error:', error);
          toast.error(`Failed to verify payment: ${error.message}`);
        })
        .finally(() => {
          setIsVerifying(false);
        });

      router.replace(`/bounty/${bountyId}`);
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled. You can complete payment later.');
      router.replace(`/bounty/${bountyId}`);
    }
  }, [payment, sessionId, bountyId, router, verifyCheckoutPayment]);

  return {
    isVerifying,
  };
}
