import { db, userProfile } from '@bounty/db';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 500 }
      );
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      if (
        account.metadata?.userId &&
        account.requirements?.currently_due?.length === 0
      ) {
        await db
          .update(userProfile)
          .set({ onboardingCompleted: true })
          .where(eq(userProfile.stripeAccountId, account.id));
      }
      break;
    }
    case 'payout.paid':
      console.log('Payout paid:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
