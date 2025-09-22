'use client';

import { env } from '@bounty/env/client';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { type ReactNode } from 'react';

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
  options?: StripeElementsOptions;
}

export function StripeProvider({
  children,
  clientSecret,
  options = {}
}: StripeProviderProps) {
  const defaultOptions: StripeElementsOptions = {
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#fff',
        colorBackground: '#262626',
        colorText: '#fff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
        fontSizeBase: '14px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#171717',
          border: '1px solid #404040',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
        },
        '.Input:focus': {
          borderColor: '#fff',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
        },
        '.Input--invalid': {
          borderColor: '#ef4444',
        },
        '.Label': {
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px',
        },
      },
    },
    ...options,
  };

  if (clientSecret) {
    defaultOptions.clientSecret = clientSecret;
  }

  return (
    <Elements stripe={stripePromise} options={defaultOptions}>
      {children}
    </Elements>
  );
}