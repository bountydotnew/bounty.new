import { track } from '@bounty/track';
import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { grim } from '../lib/use-dev-log';

const { error, info, warn } = grim();

import { db, waitlist } from '@bounty/db';
import { getRateLimiter } from '../lib/ratelimiter';
import { adminProcedure, publicProcedure, router } from '../trpc';

export const earlyAccessRouter = router({
  getWaitlistCount: publicProcedure.query(async () => {
    try {
      info('[getWaitlistCount] called');
      const waitlistCount = await db.select({ count: count() }).from(waitlist);
      info('[getWaitlistCount] db result:', waitlistCount);

      if (!waitlistCount[0] || typeof waitlistCount[0].count !== 'number') {
        error('[getWaitlistCount] Invalid result:', waitlistCount);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid database response',
        });
      }

      return {
        count: waitlistCount[0].count,
      };
    } catch (err) {
      error('[getWaitlistCount] Error:', err);

      // Provide more specific error messages
      if (err instanceof TRPCError) {
        throw err;
      }

      // Database connection errors
      if (err instanceof Error) {
        if (
          err.message.includes('connect') ||
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('timeout')
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed - please try again later',
          });
        }

        if (
          err.message.includes('does not exist') ||
          err.message.includes('relation')
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database table not found - migrations may not be applied',
          });
        }
      }

      // Return a default count instead of throwing an error
      warn('[getWaitlistCount] Returning default count due to error:', err);
      return {
        count: 0,
      };
    }
  }),
  // Simplified endpoint for adding emails to waitlist (rate limiting handled by web app)
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const limiter = getRateLimiter('waitlist');
        if (limiter) {
          const safeIp =
            ctx.clientIP ||
            `anonymous-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { success } = await limiter.limit(safeIp);

          if (!success) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many requests. Please try again later.',
            });
          }
        }
        info('[addToWaitlist] Processing email:', input.email);

        const userAlreadyInWaitlist = await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.email, input.email));

        if (userAlreadyInWaitlist[0]) {
          return { message: "You're already on the waitlist!" };
        }

        await db.insert(waitlist).values({
          email: input.email,
          createdAt: new Date(),
        });

        try {
          await track('waitlist_joined', { source: 'api' });
        } catch {}

        info(
          '[addToWaitlist] Successfully added email to waitlist:',
          input.email
        );
        return { message: "You've been added to the waitlist!" };
      } catch (error: unknown) {
        warn('[addToWaitlist] Error:', error);

        if (
          error instanceof Error &&
          error.message.includes('unique constraint')
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists in waitlist',
          });
        }

        if (
          error instanceof Error &&
          error.message.includes('violates not-null constraint')
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid email format',
          });
        }

        if (
          error instanceof Error &&
          (error.message.includes('connect') ||
            error.message.includes('ECONNREFUSED'))
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        if (
          error instanceof Error &&
          (error.message.includes('does not exist') ||
            error.message.includes('relation'))
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database table not found - migrations may not be applied',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to join waitlist',
        });
      }
    }),

  getAdminWaitlist: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { page, limit, search } = input;
        const _offset = (page - 1) * limit;

        let entries;
        if (search) {
          entries = await db
            .select()
            .from(waitlist)
            .where(eq(waitlist.email, search));
        } else {
          entries = await db.select().from(waitlist);
        }

        const totalCount = await db.select({ count: count() }).from(waitlist);
        const total = totalCount[0]?.count || 0;

        const stats = await db
          .select({
            total: count(),
            withAccess: count(),
          })
          .from(waitlist)
          .where(eq(waitlist.hasAccess, true));

        const totalWithAccess = stats[0]?.withAccess || 0;

        return {
          entries,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          stats: {
            total,
            withAccess: totalWithAccess,
            pending: total - totalWithAccess,
          },
        };
      } catch (err) {
        error('[getAdminWaitlist] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch waitlist data',
        });
      }
    }),

  updateWaitlistAccess: adminProcedure
    .input(
      z.object({
        id: z.string(),
        hasAccess: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, hasAccess } = input;

        await db.update(waitlist).set({ hasAccess }).where(eq(waitlist.id, id));

        info(
          '[updateWaitlistAccess] Updated access for ID:',
          id,
          'hasAccess:',
          hasAccess
        );
        return { success: true };
      } catch (err) {
        error('[updateWaitlistAccess] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update waitlist access',
        });
      }
    }),
});
