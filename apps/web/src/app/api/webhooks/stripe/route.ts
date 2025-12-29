import { db, bounty, transaction, payout } from '@bounty/db';
import { env } from '@bounty/env/server';
import { constructEvent, stripeClient } from '@bounty/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('[Stripe Webhook] Received webhook request');

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = constructEvent(
        body,
        signature,
        env.STRIPE_CONNECT_WEBHOOK_SECRET
      ) as Stripe.Event;
      console.log(`[Stripe Webhook] Event verified: ${event.type} (id: ${event.id})`);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('[Stripe Webhook] Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        const bountyId = session.metadata?.bountyId;
        const paymentIntentId = session.payment_intent as string | null;

        console.log(`[Stripe Webhook] Bounty ID: ${bountyId}, Payment Intent: ${paymentIntentId}`);

        if (bountyId && paymentIntentId) {
          // Check current bounty status for idempotency
          const [existingBounty] = await db
            .select({ paymentStatus: bounty.paymentStatus, amount: bounty.amount })
            .from(bounty)
            .where(eq(bounty.id, bountyId))
            .limit(1);

          if (!existingBounty) {
            console.warn(`[Stripe Webhook] Bounty ${bountyId} not found`);
            break;
          }

          // Idempotency check: Skip if already processed
          if (existingBounty.paymentStatus === 'held') {
            console.log(`[Stripe Webhook] Bounty ${bountyId} already processed (paymentStatus: held), skipping`);
            break;
          }

          // Retrieve the payment intent to check its status
          const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
          
          // Update bounty with payment intent ID
          const updateData: {
            stripePaymentIntentId: string;
            stripeCheckoutSessionId?: string;
            updatedAt: Date;
            paymentStatus?: 'held' | 'pending' | 'released' | 'refunded' | 'failed' | null;
            status?: string;
          } = {
            stripePaymentIntentId: paymentIntentId,
            stripeCheckoutSessionId: session.id, // Store session ID
            updatedAt: new Date(),
          };

          // If payment is already succeeded (automatic capture), update status immediately
          console.log(`[Stripe Webhook] Payment Intent status: ${paymentIntent.status}`);
          if (paymentIntent.status === 'succeeded') {
            updateData.paymentStatus = 'held';
            updateData.status = 'open';

            // Check if transaction already exists (idempotency)
            const [existingTransaction] = await db
              .select()
              .from(transaction)
              .where(eq(transaction.stripeId, paymentIntentId))
              .limit(1);

            if (!existingTransaction) {
              await db.insert(transaction).values({
                bountyId,
                type: 'payment_intent',
                amount: existingBounty.amount,
                stripeId: paymentIntentId,
              });
              console.log(`[Stripe Webhook] Created transaction record for bounty ${bountyId}`);
            } else {
              console.log(`[Stripe Webhook] Transaction already exists for payment intent ${paymentIntentId}, skipping`);
            }

            console.log(`[Stripe Webhook] Updating bounty ${bountyId} to held/open`);
          }

          await db
            .update(bounty)
            .set(updateData)
            .where(eq(bounty.id, bountyId));
          
          console.log(`[Stripe Webhook] Successfully updated bounty ${bountyId}`);
        } else {
          console.warn(`[Stripe Webhook] Missing bountyId or paymentIntentId: bountyId=${bountyId}, paymentIntentId=${paymentIntentId}`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        console.log('[Stripe Webhook] Processing payment_intent.succeeded');
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;

        console.log(`[Stripe Webhook] Payment Intent ID: ${paymentIntent.id}, Bounty ID: ${bountyId}`);

        if (bountyId) {
          // Idempotency check: Get current status
          const [existingBounty] = await db
            .select({ paymentStatus: bounty.paymentStatus, amount: bounty.amount })
            .from(bounty)
            .where(eq(bounty.id, bountyId))
            .limit(1);

          if (!existingBounty) {
            console.warn(`[Stripe Webhook] Bounty ${bountyId} not found`);
            break;
          }

          // Skip if already processed
          if (existingBounty.paymentStatus === 'held') {
            console.log(`[Stripe Webhook] Bounty ${bountyId} already processed (paymentStatus: held), skipping`);
            break;
          }

          // Update bounty payment status to held
          await db
            .update(bounty)
            .set({
              paymentStatus: 'held',
              status: 'open',
              stripePaymentIntentId: paymentIntent.id,
              updatedAt: new Date(),
            })
            .where(eq(bounty.id, bountyId));

          // Check if transaction already exists (idempotency)
          const [existingTransaction] = await db
            .select()
            .from(transaction)
            .where(eq(transaction.stripeId, paymentIntent.id))
            .limit(1);

          if (!existingTransaction) {
            await db.insert(transaction).values({
              bountyId,
              type: 'payment_intent',
              amount: existingBounty.amount,
              stripeId: paymentIntent.id,
            });
            console.log(`[Stripe Webhook] Created transaction record for bounty ${bountyId}`);
          } else {
            console.log(`[Stripe Webhook] Transaction already exists for payment intent ${paymentIntent.id}, skipping`);
          }
          
          console.log(`[Stripe Webhook] Successfully updated bounty ${bountyId} to held/open`);
        } else {
          console.warn(`[Stripe Webhook] Missing bountyId in payment_intent.succeeded event`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;

        if (bountyId) {
          await db
            .update(bounty)
            .set({
              paymentStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(bounty.id, bountyId));
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;

        if (bountyId) {
          await db
            .update(bounty)
            .set({
              paymentStatus: 'refunded',
              updatedAt: new Date(),
            })
            .where(eq(bounty.id, bountyId));
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const bountyId = transfer.metadata?.bountyId;

        if (bountyId) {
          // Log payout initiated
          await db.insert(transaction).values({
            bountyId,
            type: 'transfer',
            amount: String(transfer.amount / 100), // Convert from cents
            stripeId: transfer.id,
          });
        }
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object as Stripe.Transfer;
        const bountyId = transfer.metadata?.bountyId;

        if (bountyId) {
          // Update payout status to failed
          await db
            .update(payout)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(payout.stripeTransferId, transfer.id));
        }
        break;
      }

      case 'account.updated': {
        // This is a Connect account update event
        // We'll handle this via thin events if needed
        // For now, we'll update onboarding status when user checks their status
        break;
      }

      case 'payout.paid': {
        const payoutEvent = event.data.object as Stripe.Payout;
        // Update payout status when funds reach solver's bank
        // Note: This might be a platform payout, not a transfer payout
        // We'll handle transfer.paid events instead
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    console.log('[Stripe Webhook] Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    if (error instanceof Error) {
      console.error('[Stripe Webhook] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
