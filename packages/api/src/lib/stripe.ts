import { env } from '@bounty/env/server';
import Stripe from 'stripe';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  bountyId: string;
  userId: string;
}

export async function createBountyPaymentIntent({
  amount,
  currency,
  bountyId,
  userId,
}: CreatePaymentIntentParams) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bountyId,
        userId,
        type: 'bounty_funding',
      },
      description: `Funding for bounty ${bountyId}`,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function confirmBountyPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        bountyId: paymentIntent.metadata.bountyId,
        userId: paymentIntent.metadata.userId,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
      };
    }

    return {
      success: false,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    throw new Error('Failed to confirm payment');
  }
}
