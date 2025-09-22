'use client';

import { env } from '@bounty/env/client';
import { Button } from '@bounty/ui/components/button';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { toast } from 'sonner';

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  currency: string;
}

interface PaymentFormInnerProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  currency: string;
}

function PaymentFormInner({
  onSuccess,
  onCancel,
  amount,
  currency,
}: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!(stripe && elements)) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bounty-payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-neutral-300">Total Amount</span>
          <span className="font-semibold text-white text-xl">
            ${amount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          disabled={isProcessing}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={!stripe || isProcessing} type="submit">
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

export function StripePaymentForm({
  clientSecret,
  onSuccess,
  onCancel,
  amount,
  currency,
}: StripePaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#ffffff',
        colorBackground: '#1a1a1a',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentFormInner
        amount={amount}
        currency={currency}
        onCancel={onCancel}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
