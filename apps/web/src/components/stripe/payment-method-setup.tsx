'use client';

import { Button } from '@bounty/ui/components/button';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeCardElement } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { trpcClient } from '@/utils/trpc';

type PaymentMode = 'save' | 'one_time' | 'both';

interface PaymentMethodSetupProps {
  onSuccess?: (paymentMethodId: string) => void;
  onError?: (error: string) => void;
  mode?: PaymentMode; // 'save' = save only, 'one_time' = use without saving, 'both' = user can choose
  onSavePreferenceChange?: (save: boolean) => void;
}

export function PaymentMethodSetup({
  onSuccess,
  onError,
  mode = 'both',
  onSavePreferenceChange,
}: PaymentMethodSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  // default selection: save when both, otherwise fixed based on mode
  const [saveCard, setSaveCard] = useState<boolean>(() =>
    mode === 'one_time' ? false : true
  );

  const effectiveMode = useMemo<PaymentMode>(() => mode, [mode]);

  // propagate selection upstream so parent can send intent (save vs one-time)
  useEffect(() => {
    if (effectiveMode === 'one_time') {
      onSavePreferenceChange?.(false);
    } else if (effectiveMode === 'save') {
      onSavePreferenceChange?.(true);
    } else {
      onSavePreferenceChange?.(saveCard);
    }
  }, [effectiveMode, saveCard, onSavePreferenceChange]);

  // track element completeness and inline error for robust UX
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!(stripe && elements)) {
      onError?.('Stripe.js has not loaded yet.');
      return;
    }

    const card = elements.getElement(CardElement) as StripeCardElement | null;
    if (!card) {
      onError?.('Please enter a valid card.');
      return;
    }

    setLoading(true);
    try {
      if (
        effectiveMode === 'one_time' ||
        (effectiveMode === 'both' && !saveCard)
      ) {
        // One-time use: create a PaymentMethod from the card details but do not save to customer
        const pmRes = await stripe.createPaymentMethod({
          type: 'card',
          card,
          billing_details: {
            name: 'User Name', // TODO: pull from session/profile
          },
        });

        if (pmRes.error || !pmRes.paymentMethod) {
          onError?.(pmRes.error?.message || 'Failed to create payment method');
          return;
        }

        onSuccess?.(pmRes.paymentMethod.id);
        return;
      }

      // Save to customer: create SetupIntent and confirm it
      const response = await trpcClient.profiles.createSetupIntent.query();
      const { clientSecret } = response.data ?? {};
      if (!clientSecret) {
        onError?.('Failed to create setup intent');
        return;
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name: 'User Name', // TODO: pull from session/profile
            },
          },
        }
      );

      if (error) {
        onError?.(error.message || 'Failed to setup payment method');
        return;
      }

      const pm =
        typeof setupIntent?.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;

      if (!pm) {
        onError?.('No payment method created');
        return;
      }

      onSuccess?.(pm);
    } catch {
      onError?.('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel =
    effectiveMode === 'one_time' || (effectiveMode === 'both' && !saveCard)
      ? loading
        ? 'Using...'
        : 'Use Card This Time'
      : loading
        ? 'Saving...'
        : 'Save Payment Method';

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <CardElement
          onChange={(e) => {
            setCardComplete(Boolean(e.complete));
            setCardError(e.error?.message ?? null);
          }}
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#e5e7eb',
                '::placeholder': { color: '#9ca3af' },
              },
            },
          }}
        />
      </div>

      {cardError && (
        <p className="text-red-500 text-sm" role="alert">
          {cardError}
        </p>
      )}

      {effectiveMode === 'both' && (
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={saveCard}
            className="h-4 w-4"
            onChange={(e) => {
              const next = e.target.checked;
              setSaveCard(next);
              onSavePreferenceChange?.(next);
            }}
            type="checkbox"
          />
          Save card for future bounties
        </label>
      )}

      <Button
        disabled={!stripe || loading || !cardComplete}
        onClick={handleSubmit}
        type="button"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
