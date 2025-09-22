'use client';

import { Button } from '@bounty/ui/components/button';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { AppleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentFormProps {
  bountyId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentForm({
  bountyId,
  amount,
  currency,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess();
      } else {
        throw new Error('Payment was not completed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount Display */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-neutral-300">Total Amount</span>
          <span className="font-semibold text-white text-xl">
            {formatAmount(amount, currency)}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <PaymentElement
          onReady={() => setIsReady(true)}
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'link'],
            fields: {
              billingDetails: 'auto',
            },
          }}
        />
      </div>

      {/* Express Payment Methods */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-900 px-2 text-neutral-400">
              Or pay with
            </span>
          </div>
        </div>

        {/* Apple Pay Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-neutral-800 bg-black text-white hover:bg-neutral-800"
          disabled={!isReady || isProcessing}
        >
          <AppleIcon className="mr-2 h-4 w-4" />
          Apple Pay
        </Button>

        {/* Google Pay would be handled by PaymentElement automatically */}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || !isReady || isProcessing}
        className="w-full bg-white text-black hover:bg-gray-100"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Processing Payment...
          </div>
        ) : (
          `Pay ${formatAmount(amount, currency)}`
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center text-neutral-500 text-xs">
        <p>
          🔒 Your payment information is secure and encrypted.
          <br />
          Powered by Stripe
        </p>
      </div>
    </form>
  );
}