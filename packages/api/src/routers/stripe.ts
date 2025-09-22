import { bounty, db, user } from '@bounty/db';
import { env } from '@bounty/env/server';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const createPaymentIntentSchema = z.object({
  bountyId: z.string().uuid(),
  paymentMethodId: z.string().optional(),
  useStripeAccount: z.string().optional(), // For Connect accounts
});

const createConnectAccountSchema = z.object({
  type: z.enum(['express', 'standard']).default('express'),
  country: z.string().default('US'),
  email: z.string().email().optional(),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  bountyId: z.string().uuid(),
});

export const stripeRouter = router({
  // Create a payment intent for bounty payment
  createPaymentIntent: protectedProcedure
    .input(createPaymentIntentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get bounty details
        const [bountyData] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId));

        if (!bountyData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (bountyData.createdById === ctx.session.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot pay for your own bounty',
          });
        }

        if (bountyData.status !== 'open') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bounty is not open for payments',
          });
        }

        // Convert amount to cents
        const amountInCents = Math.round(
          Number.parseFloat(bountyData.amount) * 100
        );

        // Get the bounty creator's Stripe account ID if they have one
        let applicationFeeAmount = 0;
        let onBehalfOf: string | undefined;

        // Calculate platform fee (e.g., 5% of the bounty amount)
        applicationFeeAmount = Math.round(amountInCents * 0.05);

        const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
          amount: amountInCents,
          currency: bountyData.currency.toLowerCase(),
          metadata: {
            bountyId: input.bountyId,
            userId: ctx.session.user.id,
            bountyTitle: bountyData.title,
          },
          description: `Payment for bounty: ${bountyData.title}`,
          // Enable payment methods that support instant settlement
          payment_method_types: ['card', 'link', 'us_bank_account'],
          // Enable modern payment features
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never', // Keep flow in-app
          },
        };

        // If using Stripe Connect, set up the transfer
        if (input.useStripeAccount) {
          paymentIntentParams.application_fee_amount = applicationFeeAmount;
          paymentIntentParams.on_behalf_of = input.useStripeAccount;
          paymentIntentParams.transfer_data = {
            destination: input.useStripeAccount,
          };
        }

        const paymentIntent =
          await stripe.paymentIntents.create(paymentIntentParams);

        return {
          success: true,
          data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amountInCents,
            currency: bountyData.currency,
            applicationFeeAmount,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment intent',
          cause: error,
        });
      }
    }),

  // Confirm payment and update bounty status
  confirmPayment: protectedProcedure
    .input(confirmPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
          input.paymentIntentId
        );

        if (paymentIntent.status !== 'succeeded') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payment has not succeeded',
          });
        }

        // Verify the payment intent belongs to this user and bounty
        if (
          paymentIntent.metadata?.userId !== ctx.session.user.id ||
          paymentIntent.metadata?.bountyId !== input.bountyId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Payment verification failed',
          });
        }

        // Update bounty status to indicate payment has been made
        await db
          .update(bounty)
          .set({
            status: 'funded',
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          message: 'Payment confirmed and bounty funded successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm payment',
          cause: error,
        });
      }
    }),

  // Create Stripe Connect account for bounty creators
  createConnectAccount: protectedProcedure
    .input(createConnectAccountSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const account = await stripe.accounts.create({
          type: input.type,
          country: input.country,
          email: input.email || ctx.session.user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email || '',
          },
        });

        return {
          success: true,
          data: {
            accountId: account.id,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Connect account',
          cause: error,
        });
      }
    }),

  // Create account link for onboarding
  createAccountLink: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const accountLink = await stripe.accountLinks.create({
          account: input.accountId,
          refresh_url: `${env.BETTER_AUTH_URL}/settings?stripe_refresh=true`,
          return_url: `${env.BETTER_AUTH_URL}/settings?stripe_complete=true`,
          type: 'account_onboarding',
        });

        return {
          success: true,
          data: {
            url: accountLink.url,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create account link',
          cause: error,
        });
      }
    }),

  // Get Connect account status
  getAccountStatus: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const account = await stripe.accounts.retrieve(input.accountId);

        return {
          success: true,
          data: {
            id: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            requiresAction: !(
              account.details_submitted &&
              account.charges_enabled &&
              account.payouts_enabled
            ),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get account status',
          cause: error,
        });
      }
    }),

  // Webhook handler for Stripe events
  handleWebhook: publicProcedure
    .input(
      z.object({
        rawBody: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const event = stripe.webhooks.constructEvent(
          input.rawBody,
          input.signature,
          env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const bountyId = paymentIntent.metadata?.bountyId;

            if (bountyId) {
              // Update bounty status
              await db
                .update(bounty)
                .set({
                  status: 'funded',
                  updatedAt: new Date(),
                })
                .where(eq(bounty.id, bountyId));
            }
            break;
          }

          case 'account.updated': {
            // Handle Connect account updates
            const account = event.data.object as Stripe.Account;
            // Update user account status in database if needed
            break;
          }

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Webhook signature verification failed',
          cause: error,
        });
      }
    }),

  // Get payment methods for user
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    try {
      // This would typically be stored in your database
      // For now, we'll return an empty array as setup is needed per customer
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get payment methods',
        cause: error,
      });
    }
  }),
});
