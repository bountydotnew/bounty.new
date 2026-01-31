import { db, payout, user } from '@bounty/db';
import { TRPCError } from '@trpc/server';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import {
  createConnectAccount,
  createConnectAccountLink,
  createLoginLink,
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
      let accountDetails = null;
      if (userData.stripeConnectAccountId) {
        try {
          const status = await getConnectAccountStatus(
            userData.stripeConnectAccountId
          );
          accountStatus = {
            cardPaymentsActive: status.cardPaymentsActive,
            onboardingComplete: status.onboardingComplete,
            transfersActive: status.transfersActive,
          };
          
          // Extract detailed account information
          const account = status.account;
          accountDetails = {
            chargesEnabled: account.charges_enabled ?? false,
            detailsSubmitted: account.details_submitted ?? false,
            payoutsEnabled: account.payouts_enabled ?? false,
            capabilities: {
              cardPayments: account.capabilities?.card_payments ?? 'inactive',
              transfers: account.capabilities?.transfers ?? 'inactive',
            },
            requirements: {
              currentlyDue: account.requirements?.currently_due ?? [],
              eventuallyDue: account.requirements?.eventually_due ?? [],
              pastDue: account.requirements?.past_due ?? [],
            },
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
          transfersActive: accountStatus?.transfersActive || false,
          connectAccountId: userData.stripeConnectAccountId,
          accountDetails,
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

      // Verify the account exists and check onboarding status
      let accountStatus;
      try {
        accountStatus = await getConnectAccountStatus(userData.stripeConnectAccountId);
      } catch (statusError) {
        console.error('Connect account not found in Stripe:', statusError);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Connect account not found. Please complete onboarding again.',
          cause: statusError,
        });
      }

      // If onboarding is not complete, return an onboarding link instead
      if (!accountStatus.onboardingComplete) {
        const baseUrl = env.BETTER_AUTH_URL;
        const accountLink = await createConnectAccountLink({
          accountId: userData.stripeConnectAccountId,
          returnUrl: `${baseUrl}/settings/payments?onboarding=success`,
          refreshUrl: `${baseUrl}/settings/payments?onboarding=refresh`,
        });

        return {
          success: true,
          data: {
            url: accountLink.url,
            isOnboarding: true,
          },
        };
      }

      // Account is onboarded, create login link for Express Dashboard
      // Login links allow connected accounts to access their Express Dashboard
      // See: https://docs.stripe.com/connect/express-dashboard#create-a-login-link
      try {
        const loginLink = await createLoginLink(userData.stripeConnectAccountId);

        return {
          success: true,
          data: {
            url: loginLink.url,
            isOnboarding: false,
          },
        };
      } catch (loginError) {
        // If login link creation fails, account might not be fully onboarded
        // Fallback to onboarding link
        const errorMessage =
          loginError instanceof Error ? loginError.message : 'Unknown error';
        
        console.log(
          'Failed to create login link, falling back to onboarding:',
          errorMessage
        );
        
        const baseUrl = env.BETTER_AUTH_URL;
        const accountLink = await createConnectAccountLink({
          accountId: userData.stripeConnectAccountId,
          returnUrl: `${baseUrl}/settings/payments?onboarding=success`,
          refreshUrl: `${baseUrl}/settings/payments?onboarding=refresh`,
        });

        return {
          success: true,
          data: {
            url: accountLink.url,
            isOnboarding: true,
          },
        };
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Failed to get dashboard link:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get dashboard link: ${errorMessage}`,
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

  getAccountBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [userData] = await db
        .select({
          stripeConnectAccountId: user.stripeConnectAccountId,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (!userData?.stripeConnectAccountId) {
        return {
          success: true,
          data: {
            available: 0,
            pending: 0,
            total: 0,
          },
        };
      }

      // Get balance from Stripe Connect account
      const { getConnectAccountBalance } = await import('@bounty/stripe');
      const balance = await getConnectAccountBalance(userData.stripeConnectAccountId);

      // Sum up USD balances
      const availableUSD = balance.available.find((b) => b.currency === 'usd')?.amount || 0;
      const pendingUSD = balance.pending.find((b) => b.currency === 'usd')?.amount || 0;
      const totalUSD = (availableUSD + pendingUSD) / 100; // Convert from cents

      return {
        success: true,
        data: {
          available: availableUSD / 100,
          pending: pendingUSD / 100,
          total: totalUSD,
        },
      };
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get account balance',
        cause: error,
      });
    }
  }),

  getActivity: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        const { bounty } = await import('@bounty/db');

        // Use raw SQL with UNION ALL for efficient pagination at database level
        const activities = await db.execute(
          sql`
            SELECT * FROM (
              SELECT
                p.id,
                p.bounty_id as "bountyId",
                p.amount,
                p.status,
                p.stripe_transfer_id as "stripeTransferId",
                p.created_at as "createdAt",
                'payout' as type
              FROM payout p
              WHERE p.user_id = ${ctx.session.user.id}
              UNION ALL
              SELECT
                b.id,
                b.id as "bountyId",
                b.amount,
                b.payment_status as status,
                b.stripe_transfer_id as "stripeTransferId",
                b.created_at as "createdAt",
                'created' as type
              FROM bounty b
              WHERE b.created_by_id = ${ctx.session.user.id}
            ) activity
            ORDER BY "createdAt" DESC
            LIMIT ${input.limit}
            OFFSET ${offset}
          `
        );

        // Get bounty details only for the paginated results
        const bountyIds = activities.rows.map((a: any) => a.bountyId);
        const bountyDetails = bountyIds.length > 0
          ? await db
              .select({
                id: bounty.id,
                githubRepoOwner: bounty.githubRepoOwner,
                githubRepoName: bounty.githubRepoName,
                title: bounty.title,
              })
              .from(bounty)
              .where(sql`${bounty.id} = ANY(${bountyIds})`)
          : [];

        const bountyMap = new Map(bountyDetails.map((b) => [b.id, b]));

        // Enrich activity with bounty details
        const enrichedActivity = activities.rows.map((activity: any) => {
          const details = bountyMap.get(activity.bountyId);
          return {
            ...activity,
            bounty: details
              ? {
                  id: details.id,
                  githubRepoOwner: details.githubRepoOwner,
                  githubRepoName: details.githubRepoName,
                  title: details.title,
                }
              : null,
          };
        });

        return {
          success: true,
          data: enrichedActivity,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: -1, // Unknown total without separate count query
            totalPages: -1,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get activity',
          cause: error,
        });
      }
    }),
});
