'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

export interface PaymentHookProps {
  bountyId: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function usePayment({ bountyId, onSuccess, onError }: PaymentHookProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createPaymentIntent = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.data.clientSecret);
      setPaymentIntentId(data.data.paymentIntentId);
    },
    onError: (error) => {
      toast.error(error.message);
      onError?.(error.message);
    },
  });

  const confirmPayment = trpc.stripe.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success('Payment successful! Your bounty has been funded.');
      onSuccess?.(paymentIntentId || '');
    },
    onError: (error) => {
      toast.error(error.message);
      onError?.(error.message);
    },
  });

  const initiatePayment = useCallback(
    (options?: { useStripeAccount?: string }) => {
      createPaymentIntent.mutate({
        bountyId,
        useStripeAccount: options?.useStripeAccount,
      });
    },
    [bountyId, createPaymentIntent]
  );

  const completePayment = useCallback(() => {
    if (paymentIntentId) {
      confirmPayment.mutate({
        paymentIntentId,
        bountyId,
      });
    }
  }, [paymentIntentId, bountyId, confirmPayment]);

  const reset = useCallback(() => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setIsProcessing(false);
  }, []);

  return {
    // State
    clientSecret,
    paymentIntentId,
    isProcessing:
      isProcessing || createPaymentIntent.isPending || confirmPayment.isPending,

    // Actions
    initiatePayment,
    completePayment,
    reset,

    // Status
    isCreatingPaymentIntent: createPaymentIntent.isPending,
    isConfirmingPayment: confirmPayment.isPending,
  };
}
