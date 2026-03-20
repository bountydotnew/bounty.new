import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { getAdminEvents, getEventStats } from '@bounty/db';

export const adminEventsRouter = router({
  /**
   * Get admin events for the activity feed
   */
  getEvents: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          eventType: z
            .enum([
              'user_signup',
              'user_banned',
              'user_unbanned',
              'content_reported',
              'profanity_blocked',
              'content_hidden',
              'content_unhidden',
              'ratelimit_hit',
              'bounty_created',
              'bounty_funded',
              'bounty_completed',
              'bounty_cancelled',
              'admin_action',
            ])
            .optional(),
          actorId: z.string().uuid().optional(),
          targetId: z.string().optional(),
          since: z.string().datetime().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { limit, offset, eventType, actorId, targetId, since } =
        input ?? {};

      const result = await getAdminEvents({
        limit: limit ?? 50,
        offset: offset ?? 0,
        eventType,
        actorId,
        targetId,
        since: since ? new Date(since) : undefined,
      });

      return result;
    }),

  /**
   * Get event statistics for the admin dashboard
   */
  getStats: adminProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(90).default(7),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const stats = await getEventStats(input?.days ?? 7);
      return stats;
    }),
});
