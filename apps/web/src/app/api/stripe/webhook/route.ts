import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, userProfile } from '@bounty/db';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      if (account.metadata?.userId && account.requirements?.currently_due?.length === 0) {
        await db
          .update(userProfile)
          .set({ onboardingCompleted: true })
          .where(eq(userProfile.stripeAccountId, account.id));
      }
      break;
    case 'payout.paid':
      console.log('Payout paid:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}