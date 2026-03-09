import {
  db,
  bounty,
  transaction,
  payout,
  submission,
  cancellationRequest,
  user,
} from '@bounty/db';
import { env } from '@bounty/env/server';
import { constructEvent, stripeClient } from '@bounty/stripe';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getGithubAppManager } from '@bounty/api/driver/github-app';
import {
  fundedBountyComment,
  submissionReceivedComment,
} from '@bounty/api/src/lib/bot-comments';
import { count } from 'drizzle-orm';
import {
  FROM_ADDRESSES,
  sendEmail,
  BountyCancellationConfirm,
} from '@bounty/email';
import { sendBountyCreatedWebhook } from '@bounty/api/src/lib/use-discord-webhook';
import { createNotification } from '@bounty/db/src/services/notifications';
import { clearOperationPerformed } from '@bounty/api/src/lib/payment-lock';
import { withEvlog, useLogger, log } from '@bounty/logging';

/**
 * Sends Discord webhook notification when a bounty becomes funded
 */
async function sendFundedBountyWebhook(bountyId: string) {
  // Only send webhook outside of development (i.e., production/test)
  if (env.NODE_ENV === 'development') {
    return;
  }

  const webhookUrl =
    env.BOUNTY_FUNDED_WEBHOOK_URL || env.BOUNTY_FEED_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    // Fetch bounty and creator info
    const [bountyRecord] = await db
      .select({
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        amount: bounty.amount,
        currency: bounty.currency,
        createdById: bounty.createdById,
        repositoryUrl: bounty.repositoryUrl,
        issueUrl: bounty.issueUrl,
        tags: bounty.tags,
        deadline: bounty.deadline,
      })
      .from(bounty)
      .where(eq(bounty.id, bountyId))
      .limit(1);

    if (!bountyRecord) {
      return;
    }

    const [creator] = await db
      .select({
        name: user.name,
        handle: user.handle,
      })
      .from(user)
      .where(eq(user.id, bountyRecord.createdById))
      .limit(1);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';

    // Fire-and-forget: don't await, don't let webhook failures affect payment processing
    sendBountyCreatedWebhook({
      webhookUrl,
      bounty: {
        id: bountyRecord.id,
        title: bountyRecord.title,
        description: bountyRecord.description,
        amount: bountyRecord.amount,
        currency: bountyRecord.currency,
        creatorName: creator?.name ?? null,
        creatorHandle: creator?.handle ?? null,
        bountyUrl: `${baseUrl}/bounty/${bountyRecord.id}`,
        repositoryUrl: bountyRecord.repositoryUrl ?? null,
        issueUrl: bountyRecord.issueUrl ?? null,
        tags: (bountyRecord.tags as string[] | null) ?? null,
        deadline: bountyRecord.deadline ?? null,
      },
    }).catch((error) => {
      // Silently log webhook failures
      log.error('Failed to send funded bounty webhook', { error });
    });
  } catch (error) {
    log.error('Error sending funded bounty webhook', { error });
  }
}

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
      log.info('Bounty not found, skipping GitHub comment update', { bountyId });
      return;
    }

    // Check if this bounty has a GitHub bot comment to update
    if (
      !(
        bountyRecord.githubCommentId &&
        bountyRecord.githubInstallationId &&
        bountyRecord.githubRepoOwner &&
        bountyRecord.githubRepoName
      )
    ) {
      log.info('Bounty does not have GitHub integration, skipping comment update', { bountyId });
      return;
    }

    // Get current submission count
    const [submissionCount] = await db
      .select({ count: count() })
      .from(submission)
      .where(eq(submission.bountyId, bountyId));

    // Create the funded comment
    const newComment = fundedBountyComment(
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

    log.info('Updated GitHub bot comment for bounty', { bountyId });
  } catch (error) {
    // Don't fail the webhook if GitHub update fails
    log.error('Failed to update GitHub comment for bounty', { error, bountyId });
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
      log.info('Bounty not found, skipping submission comment updates', { bountyId });
      return;
    }

    if (
      !(
        bountyRecord.githubInstallationId &&
        bountyRecord.githubRepoOwner &&
        bountyRecord.githubRepoName
      )
    ) {
      log.info('Bounty does not have GitHub integration, skipping submission comment updates', { bountyId });
      return;
    }

    const submissionComments = await db
      .select({
        githubCommentId: submission.githubCommentId,
        githubUsername: submission.githubUsername,
        githubPullRequestNumber: submission.githubPullRequestNumber,
      })
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

    await Promise.all(
      submissionComments.map((record) => {
        const updatedBody = submissionReceivedComment(
          true,
          record.githubUsername || 'contributor',
          record.githubPullRequestNumber || 0
        );
        return githubApp.editComment(
          bountyRecord.githubInstallationId!,
          bountyRecord.githubRepoOwner!,
          bountyRecord.githubRepoName!,
          record.githubCommentId!,
          updatedBody
        );
      })
    );

    log.info('Updated submission comments for bounty', { bountyId, count: submissionComments.length });
  } catch (error) {
    log.error('Failed to update submission comments for bounty', { error, bountyId });
  }
}

export const POST = withEvlog(async (request: Request) => {
  const logger = useLogger();
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    logger.set({ phase: 'init' });

    if (!signature) {
      log.error('Missing stripe-signature header');
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
      logger.set({ webhookEvent: event.type, stripeEventId: event.id });
    } catch (err) {
      log.error('Signature verification failed', { error: err });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bountyId = session.metadata?.bountyId;
        const paymentIntentId = session.payment_intent as string | null;

        logger.set({ bountyId, paymentIntentId });

        if (bountyId && paymentIntentId) {
          // Check current bounty status for idempotency
          const [existingBounty] = await db
            .select({
              paymentStatus: bounty.paymentStatus,
              amount: bounty.amount,
            })
            .from(bounty)
            .where(eq(bounty.id, bountyId))
            .limit(1);

          if (!existingBounty) {
            log.warn('Bounty not found', { bountyId });
            break;
          }

          // Idempotency check: Skip if already processed
          if (existingBounty.paymentStatus === 'held') {
            logger.set({ skipped: true, reason: 'already_held' });
            break;
          }

          // Retrieve the payment intent to check its status
          const paymentIntent =
            await stripeClient.paymentIntents.retrieve(paymentIntentId);

          // Build update data
          const updateData: {
            stripePaymentIntentId: string;
            stripeCheckoutSessionId: string;
            updatedAt: Date;
            paymentStatus?:
              | 'held'
              | 'pending'
              | 'released'
              | 'refunded'
              | 'failed'
              | null;
            status?:
              | 'draft'
              | 'open'
              | 'in_progress'
              | 'completed'
              | 'cancelled';
          } = {
            stripePaymentIntentId: paymentIntentId,
            stripeCheckoutSessionId: session.id,
            updatedAt: new Date(),
          };

          // If payment is already succeeded (automatic capture), update status immediately
          logger.set({ paymentIntentStatus: paymentIntent.status });
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
              logger.set({ transactionSkipped: true, reason: 'already_exists' });
            } else {
              await db.insert(transaction).values({
                bountyId,
                type: 'payment_intent',
                amount: existingBounty.amount,
                stripeId: paymentIntentId,
              });
              logger.set({ transactionCreated: true });
            }

            logger.set({ updatingTo: 'held/open' });
          }

          await db
            .update(bounty)
            .set(updateData)
            .where(eq(bounty.id, bountyId));

          // Update GitHub bot comments and send webhook if bounty is now funded
          if (updateData.paymentStatus === 'held') {
            await updateGitHubBotCommentOnFunding(bountyId);
            await updateSubmissionReceivedCommentsOnFunding(bountyId);
            await sendFundedBountyWebhook(bountyId);
          }

          logger.set({ success: true });
        } else {
          log.warn('Missing bountyId or paymentIntentId', { bountyId, paymentIntentId });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bountyId = paymentIntent.metadata?.bountyId;

        logger.set({ paymentIntentId: paymentIntent.id, bountyId });

        if (bountyId) {
          // Idempotency check: Get current status
          const [existingBounty] = await db
            .select({
              paymentStatus: bounty.paymentStatus,
              amount: bounty.amount,
            })
            .from(bounty)
            .where(eq(bounty.id, bountyId))
            .limit(1);

          if (!existingBounty) {
            log.warn('Bounty not found', { bountyId });
            break;
          }

          // Skip if already processed
          if (existingBounty.paymentStatus === 'held') {
            logger.set({ skipped: true, reason: 'already_held' });
            break;
          }

          // Atomic conditional update — only update if not already held.
          // This prevents race conditions when checkout.session.completed and
          // payment_intent.succeeded fire concurrently.
          const updatedRows = await db
            .update(bounty)
            .set({
              paymentStatus: 'held',
              status: 'open',
              stripePaymentIntentId: paymentIntent.id,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(bounty.id, bountyId),
                sql`${bounty.paymentStatus} != 'held'`
              )
            )
            .returning({ id: bounty.id });

          if (updatedRows.length === 0) {
            logger.set({ skipped: true, reason: 'concurrent_handler' });
            break;
          }

          // Check if transaction already exists (idempotency)
          const [existingTransaction] = await db
            .select()
            .from(transaction)
            .where(eq(transaction.stripeId, paymentIntent.id))
            .limit(1);

          if (existingTransaction) {
            logger.set({ transactionSkipped: true, reason: 'already_exists' });
          } else {
            await db.insert(transaction).values({
              bountyId,
              type: 'payment_intent',
              amount: existingBounty.amount,
              stripeId: paymentIntent.id,
            });
            logger.set({ transactionCreated: true });
          }

          // Update GitHub bot comments and send webhook now that bounty is funded
          await updateGitHubBotCommentOnFunding(bountyId);
          await updateSubmissionReceivedCommentsOnFunding(bountyId);
          await sendFundedBountyWebhook(bountyId);

          logger.set({ success: true, updatedTo: 'held/open' });
        } else {
          log.warn('Missing bountyId in payment_intent.succeeded event');
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
          // Idempotency check: Skip if transaction already exists
          const [existingTransaction] = await db
            .select()
            .from(transaction)
            .where(eq(transaction.stripeId, transfer.id))
            .limit(1);

          if (existingTransaction) {
            logger.set({ transactionSkipped: true, reason: 'already_exists', transferId: transfer.id });
            break;
          }

          // Log payout initiated - use toFixed(2) for consistent precision
          await db.insert(transaction).values({
            bountyId,
            type: 'transfer',
            amount: (transfer.amount / 100).toFixed(2),
            stripeId: transfer.id,
          });
          logger.set({ transactionCreated: true, transferId: transfer.id });
        }
        break;
      }

      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer;
        const bountyId = transfer.metadata?.bountyId;

        // Check if transfer was reversed (failed payout)
        if (bountyId && transfer.reversed) {
          logger.set({ transferReversed: true, transferId: transfer.id, bountyId });

          // Atomically revert payout + bounty state so retries see a consistent snapshot
          await db.transaction(async (tx) => {
            // Update payout status to failed
            await tx
              .update(payout)
              .set({
                status: 'failed',
                updatedAt: new Date(),
              })
              .where(eq(payout.stripeTransferId, transfer.id));

            // Revert bounty to funded state so payout can be retried
            await tx
              .update(bounty)
              .set({
                status: 'in_progress',
                paymentStatus: 'held',
                stripeTransferId: null,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(bounty.id, bountyId),
                  eq(bounty.stripeTransferId, transfer.id)
                )
              );
          });

          // Clear idempotency markers so the payout can be retried via /merge or approve
          await clearOperationPerformed('release-payout', bountyId);

          logger.set({ revertedToHeld: true });
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

      case 'charge.refund.updated': {
        const refund = event.data.object as Stripe.Refund;
        const chargeId = refund.charge as string | null;
        const paymentIntentId = refund.payment_intent as string | null;

        if (!(paymentIntentId || chargeId)) {
          log.warn('charge.refund.updated: No payment_intent or charge on refund');
          break;
        }

        // Use payment_intent from refund if available, otherwise fetch from charge
        let finalPaymentIntentId = paymentIntentId;
        if (!finalPaymentIntentId && chargeId) {
          try {
            const charge = await stripeClient.charges.retrieve(chargeId);
            finalPaymentIntentId = charge.payment_intent as string | null;
          } catch (e) {
            log.warn('charge.refund.updated: Failed to fetch charge', { error: e });
          }
        }

        if (!finalPaymentIntentId) {
          log.warn('charge.refund.updated: Could not determine payment_intent');
          break;
        }

        // Only process succeeded refunds
        if (refund.status !== 'succeeded') {
          logger.set({ skipped: true, reason: 'refund_not_succeeded', refundStatus: refund.status });
          break;
        }

        // Find the bounty by payment intent ID
        const [bountyRecord] = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            amount: bounty.amount,
            paymentStatus: bounty.paymentStatus,
            status: bounty.status,
            createdById: bounty.createdById,
          })
          .from(bounty)
          .where(eq(bounty.stripePaymentIntentId, finalPaymentIntentId))
          .limit(1);

        if (!bountyRecord) {
          log.warn('charge.refund.updated: No bounty found for payment intent', { paymentIntentId: finalPaymentIntentId });
          break;
        }

        // Skip if already refunded
        if (bountyRecord.paymentStatus === 'refunded') {
          logger.set({ skipped: true, reason: 'already_refunded', bountyId: bountyRecord.id });
          break;
        }

        // Calculate refund amount
        const refundedAmount = refund.amount / 100; // Convert from cents
        const originalAmount = Number(bountyRecord.amount);
        const platformFee = originalAmount - refundedAmount;

        logger.set({ refundedAmount, originalAmount, platformFee, bountyId: bountyRecord.id });

        // Atomic conditional update — only update if not already refunded.
        // This prevents races with the charge.refunded handler which handles
        // the full notification flow (email + in-app notification + transaction record).
        const updatedRows = await db
          .update(bounty)
          .set({
            status: 'cancelled',
            paymentStatus: 'refunded',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bounty.id, bountyRecord.id),
              sql`${bounty.paymentStatus} != 'refunded'`
            )
          )
          .returning({ id: bounty.id });

        if (updatedRows.length === 0) {
          logger.set({ skipped: true, reason: 'already_processed_by_charge_refunded' });
          break;
        }

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
          logger.set({ cancellationRequestApproved: pendingRequest.id });
        }

        // Skip notification here — the charge.refunded handler sends the full
        // notification (email + in-app + transaction record). If charge.refunded
        // fires later, it will see paymentStatus=refunded and skip the DB update
        // but still won't double-notify since the bounty status check prevents it.

        logger.set({ success: true });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string | null;

        if (!paymentIntentId) {
          log.warn('charge.refunded: No payment_intent on charge');
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
          log.warn('charge.refunded: No bounty found for payment intent', { paymentIntentId });
          break;
        }

        // Calculate refund amount from the charge
        const refundedAmount = charge.amount_refunded / 100; // Convert from cents
        const originalAmount = Number(bountyRecord.amount);
        const platformFee = originalAmount - refundedAmount;

        logger.set({ refundedAmount, originalAmount, platformFee, bountyId: bountyRecord.id });

        // Atomic conditional update — only process if not already refunded.
        // Prevents races with charge.refund.updated and duplicate webhook deliveries.
        const refundUpdatedRows = await db
          .update(bounty)
          .set({
            status: 'cancelled',
            paymentStatus: 'refunded',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bounty.id, bountyRecord.id),
              sql`${bounty.paymentStatus} != 'refunded'`
            )
          )
          .returning({ id: bounty.id });

        if (refundUpdatedRows.length === 0) {
          logger.set({ skipped: true, reason: 'already_refunded' });
          break;
        }

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
          logger.set({ cancellationRequestApproved: pendingRequest.id });
        }

        // Send confirmation email to the bounty creator
        const [creator] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, bountyRecord.createdById))
          .limit(1);

        if (creator?.email) {
          try {
            const baseUrl =
              process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
            await sendEmail({
              from: FROM_ADDRESSES.notifications,
              to: creator.email,
              subject: `Refund Processed: ${bountyRecord.title}`,
              react: BountyCancellationConfirm({
                bountyTitle: bountyRecord.title,
                bountyUrl: `${baseUrl}/bounty/${bountyRecord.id}`,
                userName: creator.name || 'there',
                originalAmount: `$${originalAmount.toLocaleString()}`,
                refundAmount: `$${refundedAmount.toLocaleString()}`,
                platformFee: `$${platformFee.toLocaleString()}`,
              }),
            });
            logger.set({ refundEmailSent: true, recipientEmail: creator.email });
          } catch (emailError) {
            log.error('Failed to send refund email', { error: emailError, recipientEmail: creator.email });
          }
        }

        // Create in-app notification for the bounty creator
        await createNotification({
          userId: bountyRecord.createdById,
          type: 'system',
          title: 'Bounty Refunded',
          message: `Your bounty "${bountyRecord.title}" has been refunded and cancelled. Refund amount: $${refundedAmount.toLocaleString()}`,
          data: {
            bountyId: bountyRecord.id,
            linkTo: `/bounty/${bountyRecord.id}`,
          },
        });

        // Idempotency check for refund transaction
        const [existingRefundTransaction] = await db
          .select()
          .from(transaction)
          .where(eq(transaction.stripeId, charge.id))
          .limit(1);

        if (existingRefundTransaction) {
          logger.set({ refundTransactionSkipped: true, reason: 'already_exists', chargeId: charge.id });
        } else {
          // Log the refund transaction
          await db.insert(transaction).values({
            bountyId: bountyRecord.id,
            type: 'refund',
            amount: refundedAmount.toFixed(2),
            stripeId: charge.id,
          });
          logger.set({ refundTransactionCreated: true, chargeId: charge.id });
        }

        logger.set({ success: true });
        break;
      }

      default:
        logger.set({ unhandledEvent: true });
    }

    logger.set({ processed: true });
    return NextResponse.json({ received: true });
  } catch (error) {
    // Log detailed error internally
    log.error('Error processing webhook', {
      error,
      ...(error instanceof Error && {
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    });
    // Return generic error to client - don't leak implementation details
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
});
