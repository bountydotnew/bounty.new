import { db, payout, user } from '@bounty/db';
import { TRPCError } from '@trpc/server';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import {
  createConnectAccount,
  createConnectAccountLink,
  createDashboardLink,
  getConnectAccountStatus,
} from '@bounty/stripe';
import { env } from '@bounty/env/server';

export const connectRouter = router({
  getConnectStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [userData] = await db
        .select({
          stripeConnectAccountId: user.stripeConnectAccountId,
          stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (!userData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      let accountStatus = null;
      if (userData.stripeConnectAccountId) {
        try {
          const status = await getConnectAccountStatus(
            userData.stripeConnectAccountId
          );
          accountStatus = {
            cardPaymentsActive: status.cardPaymentsActive,
            onboardingComplete: status.onboardingComplete,
          };
          
          // Update user's onboarding status if it changed
          if (status.onboardingComplete !== userData.stripeConnectOnboardingComplete) {
            await db
              .update(user)
              .set({ stripeConnectOnboardingComplete: status.onboardingComplete })
              .where(eq(user.id, ctx.session.user.id));
          }
        } catch (error) {
          // Account might not exist in Stripe, ignore
          console.error('Failed to get Connect account status:', error);
        }
      }

      return {
        success: true,
        data: {
          hasConnectAccount: Boolean(userData.stripeConnectAccountId),
          onboardingComplete:
            accountStatus?.onboardingComplete ??
            userData.stripeConnectOnboardingComplete ??
            false,
          cardPaymentsActive: accountStatus?.cardPaymentsActive || false,
          connectAccountId: userData.stripeConnectAccountId,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get Connect status',
        cause: error,
      });
    }
  }),

  createConnectAccountLink: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const [userData] = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          stripeConnectAccountId: user.stripeConnectAccountId,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (!userData || !userData.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email is required',
        });
      }

      let connectAccountId = userData.stripeConnectAccountId;

      // Create Connect account if it doesn't exist
      if (!connectAccountId) {
        try {
          const account = await createConnectAccount(
            userData.email,
            userData.name || userData.email
          );
          connectAccountId = account.id;

          // Update user record
          await db
            .update(user)
            .set({ stripeConnectAccountId: connectAccountId })
            .where(eq(user.id, ctx.session.user.id));
        } catch (error) {
          console.error('Failed to create Connect account:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          
          // Provide helpful error message for Connect not enabled
          if (errorMessage.includes('signed up for Connect')) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Stripe Connect is not enabled for your account. Please enable Connect in your Stripe Dashboard: https://dashboard.stripe.com/settings/connect',
              cause: error,
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Stripe Connect account: ${errorMessage}`,
            cause: error,
          });
        }
      }

      // Create account link for onboarding
      try {
        const baseUrl = env.BETTER_AUTH_URL;
        const accountLink = await createConnectAccountLink({
          accountId: connectAccountId,
          returnUrl: `${baseUrl}/settings/payments?onboarding=success`,
          refreshUrl: `${baseUrl}/settings/payments?onboarding=refresh`,
        });

        return {
          success: true,
          data: {
            url: accountLink.url,
          },
        };
      } catch (error) {
        console.error('Failed to create account link:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create account link: ${errorMessage}`,
          cause: error,
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create Connect account link: ${errorMessage}`,
        cause: error,
      });
    }
  }),

  getConnectDashboardLink: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const [userData] = await db
        .select({
          stripeConnectAccountId: user.stripeConnectAccountId,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (!userData?.stripeConnectAccountId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Connect account found. Please complete onboarding first.',
        });
      }

      const baseUrl = env.BETTER_AUTH_URL;
      const dashboardLink = await createDashboardLink(
        userData.stripeConnectAccountId,
        `${baseUrl}/settings/payments`
      );

      return {
        success: true,
        data: {
          url: dashboardLink.url,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get dashboard link',
        cause: error,
      });
    }
  }),

  getPayoutHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        const payouts = await db
          .select()
          .from(payout)
          .where(eq(payout.userId, ctx.session.user.id))
          .orderBy(desc(payout.createdAt))
          .limit(input.limit)
          .offset(offset);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(payout)
          .where(eq(payout.userId, ctx.session.user.id));

        const count = countResult[0]?.count ?? 0;

        return {
          success: true,
          data: payouts,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: count,
            totalPages: Math.ceil(count / input.limit),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get payout history',
          cause: error,
        });
      }
    }),
});
