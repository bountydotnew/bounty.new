import { db, bounty, transaction, payout, submission, cancellationRequest, user } from '@bounty/db';
import { env } from '@bounty/env/server';
import { constructEvent, stripeClient } from '@bounty/stripe';
import { and, eq, isNotNull } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  getGithubAppManager,
  createFundedBountyComment,
  createSubmissionReceivedComment,
} from '@bounty/api/driver/github-app';
import { count } from 'drizzle-orm';
import { FROM_ADDRESSES, sendEmail, BountyCancellationConfirm } from '@bounty/email';

/**
 * Updates the GitHub bot comment when a bounty becomes funded
 */
async function updateGitHubBotCommentOnFunding(bountyId: string) {
  try {
    // Get the bounty with GitHub fields
    const [bountyRecord] = await db
      .select({
        id: bounty.id,
        amount: bounty.amount,
        currency: bounty.currency,
        githubCommentId: bounty.githubCommentId,
        githubInstallationId: bounty.githubInstallationId,
        githubRepoOwner: bounty.githubRepoOwner,
        githubRepoName: bounty.githubRepoName,
      })
      .from(bounty)
      .where(eq(bounty.id, bountyId))
      .limit(1);

    if (!bountyRecord) {
      console.log(`[Stripe Webhook] Bounty ${bountyId} not found, skipping GitHub comment update`);
      return;
    }

    // Check if this bounty has a GitHub bot comment to update
    if (!bountyRecord.githubCommentId || !bountyRecord.githubInstallationId || !bountyRecord.githubRepoOwner || !bountyRecord.githubRepoName) {
      console.log(`[Stripe Webhook] Bounty ${bountyId} does not have GitHub integration, skipping comment update`);
      return;
    }

    // Get current submission count
    const [submissionCount] = await db
      .select({ count: count() })
      .from(submission)
      .where(eq(submission.bountyId, bountyId));

    // Create the funded comment
    const newComment = createFundedBountyComment(
      bountyRecord.id,
      submissionCount?.count || 0
    );

    // Update the GitHub comment
    const githubApp = getGithubAppManager();
    await githubApp.editComment(
      bountyRecord.githubInstallationId,
      bountyRecord.githubRepoOwner,
      bountyRecord.githubRepoName,
      bountyRecord.githubCommentId,
      newComment
    );

    console.log(`[Stripe Webhook] Updated GitHub bot comment for bounty ${bountyId}`);
  } catch (error) {
    // Don't fail the webhook if GitHub update fails
    console.error(`[Stripe Webhook] Failed to update GitHub comment for bounty ${bountyId}:`, error);
  }
}

/**
 * Updates all "Submission received" comments to funded messaging
 */
async function updateSubmissionReceivedCommentsOnFunding(bountyId: string) {
  try {
    const [bountyRecord] = await db
      .select({
        id: bounty.id,
        githubInstallationId: bounty.githubInstallationId,
        githubRepoOwner: bounty.githubRepoOwner,
        githubRepoName: bounty.githubRepoName,
      })
      .from(bounty)
      .where(eq(bounty.id, bountyId))
      .limit(1);

    if (!bountyRecord) {
      console.log(`[Stripe Webhook] Bounty ${bountyId} not found, skipping submission comment updates`);
      return;
    }

    if (!bountyRecord.githubInstallationId || !bountyRecord.githubRepoOwner || !bountyRecord.githubRepoName) {
      console.log(`[Stripe Webhook] Bounty ${bountyId} does not have GitHub integration, skipping submission comment updates`);
      return;
    }

    const submissionComments = await db
      .select({ githubCommentId: submission.githubCommentId })
      .from(submission)
      .where(
        and(
          eq(submission.bountyId, bountyId),
          isNotNull(submission.githubCommentId)
        )
      );

    if (!submissionComments.length) {
      return;
    }

    const githubApp = getGithubAppManager();
    const updatedBody = createSubmissionReceivedComment(true);

    await Promise.all(
      submissionComments.map((record) =>
        githubApp.editComment(
          bountyRecord.githubInstallationId!,
          bountyRecord.githubRepoOwner!,
          bountyRecord.githubRepoName!,
          record.githubCommentId!,
          updatedBody
        )
      )
    );

    console.log(`[Stripe Webhook] Updated ${submissionComments.length} submission comments for bounty ${bountyId}`);
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to update submission comments for bounty ${bountyId}:`, error);
  }
}

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
          
          
          // Build update data
          const updateData: {
            stripePaymentIntentId: string;
            stripeCheckoutSessionId: string;
            updatedAt: Date;
            paymentStatus?: 'held' | 'pending' | 'released' | 'refunded' | 'failed' | null;
            status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
          } = {
            stripePaymentIntentId: paymentIntentId,
            stripeCheckoutSessionId: session.id,
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

            if (existingTransaction) {
              console.log(`[Stripe Webhook] Transaction already exists for payment intent ${paymentIntentId}, skipping`);
            } else {
              await db.insert(transaction).values({
                bountyId,
                type: 'payment_intent',
                amount: existingBounty.amount,
                stripeId: paymentIntentId,
              });
              console.log(`[Stripe Webhook] Created transaction record for bounty ${bountyId}`);
            }

            console.log(`[Stripe Webhook] Updating bounty ${bountyId} to held/open`);
          }

          await db
            .update(bounty)
            .set(updateData)
            .where(eq(bounty.id, bountyId));

          // Update GitHub bot comments if bounty is now funded
          if (updateData.paymentStatus === 'held') {
            await updateGitHubBotCommentOnFunding(bountyId);
            await updateSubmissionReceivedCommentsOnFunding(bountyId);
          }

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

          if (existingTransaction) {
            console.log(`[Stripe Webhook] Transaction already exists for payment intent ${paymentIntent.id}, skipping`);
          } else {
            await db.insert(transaction).values({
              bountyId,
              type: 'payment_intent',
              amount: existingBounty.amount,
              stripeId: paymentIntent.id,
            });
            console.log(`[Stripe Webhook] Created transaction record for bounty ${bountyId}`);
          }

          // Update GitHub bot comments now that bounty is funded
          await updateGitHubBotCommentOnFunding(bountyId);
          await updateSubmissionReceivedCommentsOnFunding(bountyId);

          console.log(`[Stripe Webhook] Successfully updated bounty ${bountyId} to held/open`);
        } else {
          console.warn('[Stripe Webhook] Missing bountyId in payment_intent.succeeded event');
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

      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer;
        const bountyId = transfer.metadata?.bountyId;

        // Check if transfer failed
        if (bountyId && transfer.reversed) {
          // Update payout status to failed if transfer was reversed
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
        // Update payout status when funds reach solver's bank
        // Note: This might be a platform payout, not a transfer payout
        // We'll handle transfer.paid events instead
        break;
      }

      case 'charge.refunded': {
        console.log('[Stripe Webhook] Processing charge.refunded');
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string | null;

        if (!paymentIntentId) {
          console.warn('[Stripe Webhook] charge.refunded: No payment_intent on charge');
          break;
        }

        // Find the bounty by payment intent ID
        const [bountyRecord] = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            amount: bounty.amount,
            paymentStatus: bounty.paymentStatus,
            createdById: bounty.createdById,
          })
          .from(bounty)
          .where(eq(bounty.stripePaymentIntentId, paymentIntentId))
          .limit(1);

        if (!bountyRecord) {
          console.warn(`[Stripe Webhook] charge.refunded: No bounty found for payment intent ${paymentIntentId}`);
          break;
        }

        // Skip if already refunded
        if (bountyRecord.paymentStatus === 'refunded') {
          console.log(`[Stripe Webhook] Bounty ${bountyRecord.id} already marked as refunded, skipping`);
          break;
        }

        // Calculate refund amount from the charge
        const refundedAmount = charge.amount_refunded / 100; // Convert from cents
        const originalAmount = Number(bountyRecord.amount);
        const platformFee = originalAmount - refundedAmount;

        console.log(`[Stripe Webhook] Refund: ${refundedAmount} of ${originalAmount} (fee: ${platformFee})`);

        // Update bounty status to cancelled/refunded
        await db
          .update(bounty)
          .set({
            status: 'cancelled',
            paymentStatus: 'refunded',
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, bountyRecord.id));

        // If there's a pending cancellation request, mark it as approved
        const [pendingRequest] = await db
          .select()
          .from(cancellationRequest)
          .where(
            and(
              eq(cancellationRequest.bountyId, bountyRecord.id),
              eq(cancellationRequest.status, 'pending')
            )
          )
          .limit(1);

        if (pendingRequest) {
          await db
            .update(cancellationRequest)
            .set({
              status: 'approved',
              processedAt: new Date(),
              refundAmount: refundedAmount.toString(),
            })
            .where(eq(cancellationRequest.id, pendingRequest.id));
          console.log(`[Stripe Webhook] Marked cancellation request ${pendingRequest.id} as approved`);
        }

        // Send confirmation email to the bounty creator
        const [creator] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, bountyRecord.createdById))
          .limit(1);

        if (creator?.email) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
            await sendEmail({
              from: FROM_ADDRESSES.notifications,
              to: creator.email,
              subject: `Refund Processed: ${bountyRecord.title}`,
              react: BountyCancellationConfirm({
                bountyTitle: bountyRecord.title,
                bountyUrl: `${baseUrl}/bounty/${bountyRecord.id}`,
                creatorName: creator.name || 'there',
                originalAmount: `$${originalAmount.toLocaleString()}`,
                refundAmount: `$${refundedAmount.toLocaleString()}`,
                platformFee: `$${platformFee.toLocaleString()}`,
              }),
            });
            console.log(`[Stripe Webhook] Sent refund confirmation email to ${creator.email}`);
          } catch (emailError) {
            console.error(`[Stripe Webhook] Failed to send refund email to ${creator.email}:`, emailError);
          }
        }

        // Log the refund transaction
        await db.insert(transaction).values({
          bountyId: bountyRecord.id,
          type: 'refund',
          amount: refundedAmount.toString(),
          stripeId: charge.id,
        });

        console.log(`[Stripe Webhook] Successfully processed refund for bounty ${bountyRecord.id}`);
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
