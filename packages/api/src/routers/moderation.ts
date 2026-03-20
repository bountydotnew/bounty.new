import { z } from 'zod';
import { eq, desc, and, count, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure, protectedProcedure } from '../trpc';
import {
  moderationFlags,
  bounty,
  bountyComment,
  submission,
  user,
} from '@bounty/db';
import { trackAdminEvent } from '@bounty/track/server';

export const moderationRouter = router({
  /**
   * Get pending moderation flags for admin review
   * Enriches user reports with user data (email, image, etc.)
   */
  getPendingFlags: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0 } = input ?? {};

      const flags = await ctx.db
        .select()
        .from(moderationFlags)
        .where(eq(moderationFlags.status, 'pending'))
        .orderBy(desc(moderationFlags.createdAt))
        .limit(limit)
        .offset(offset);

      // Enrich user reports with user data
      const userFlagIds = flags
        .filter((f) => f.contentType === 'user')
        .map((f) => f.contentId);

      let userMap: Record<
        string,
        { name: string | null; email: string; image: string | null; handle: string | null }
      > = {};

      if (userFlagIds.length > 0) {
        const users = await ctx.db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            handle: user.handle,
          })
          .from(user)
          .where(inArray(user.id, userFlagIds));

        userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      }

      // Enrich bounty reports with bounty data
      const bountyFlagIds = flags
        .filter((f) => f.contentType === 'bounty')
        .map((f) => f.contentId);

      let bountyMap: Record<
        string,
        {
          title: string;
          amount: string;
          status: string;
          creatorName: string | null;
          creatorHandle: string | null;
          creatorImage: string | null;
        }
      > = {};

      if (bountyFlagIds.length > 0) {
        const bounties = await ctx.db
          .select({
            id: bounty.id,
            title: bounty.title,
            amount: bounty.amount,
            status: bounty.status,
            creatorName: user.name,
            creatorHandle: user.handle,
            creatorImage: user.image,
          })
          .from(bounty)
          .leftJoin(user, eq(bounty.createdById, user.id))
          .where(inArray(bounty.id, bountyFlagIds));

        bountyMap = Object.fromEntries(bounties.map((b) => [b.id, b]));
      }

      return flags.map((flag) => ({
        ...flag,
        reportedUser:
          flag.contentType === 'user' ? userMap[flag.contentId] ?? null : null,
        reportedBounty:
          flag.contentType === 'bounty' ? bountyMap[flag.contentId] ?? null : null,
      }));
    }),

  /**
   * Get all moderation flags with optional filtering
   * Enriches user and bounty reports with relevant data
   */
  getFlags: adminProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'auto_flagged'])
          .optional(),
        contentType: z.enum(['bounty', 'comment', 'submission', 'user']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, contentType, limit, offset } = input;

      const conditions = [];
      if (status) {
        conditions.push(eq(moderationFlags.status, status));
      }
      if (contentType) {
        conditions.push(eq(moderationFlags.contentType, contentType));
      }

      const flags = await ctx.db
        .select()
        .from(moderationFlags)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(moderationFlags.createdAt))
        .limit(limit)
        .offset(offset);

      // Enrich user reports with user data
      const userFlagIds = flags
        .filter((f) => f.contentType === 'user')
        .map((f) => f.contentId);

      let userMap: Record<
        string,
        { name: string | null; email: string; image: string | null; handle: string | null }
      > = {};

      if (userFlagIds.length > 0) {
        const users = await ctx.db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            handle: user.handle,
          })
          .from(user)
          .where(inArray(user.id, userFlagIds));

        userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      }

      // Enrich bounty reports with bounty data
      const bountyFlagIds = flags
        .filter((f) => f.contentType === 'bounty')
        .map((f) => f.contentId);

      let bountyMap: Record<
        string,
        {
          title: string;
          amount: string;
          status: string;
          creatorName: string | null;
          creatorHandle: string | null;
          creatorImage: string | null;
        }
      > = {};

      if (bountyFlagIds.length > 0) {
        const bounties = await ctx.db
          .select({
            id: bounty.id,
            title: bounty.title,
            amount: bounty.amount,
            status: bounty.status,
            creatorName: user.name,
            creatorHandle: user.handle,
            creatorImage: user.image,
          })
          .from(bounty)
          .leftJoin(user, eq(bounty.createdById, user.id))
          .where(inArray(bounty.id, bountyFlagIds));

        bountyMap = Object.fromEntries(bounties.map((b) => [b.id, b]));
      }

      return flags.map((flag) => ({
        ...flag,
        reportedUser:
          flag.contentType === 'user' ? userMap[flag.contentId] ?? null : null,
        reportedBounty:
          flag.contentType === 'bounty' ? bountyMap[flag.contentId] ?? null : null,
      }));
    }),

  /**
   * Get count of pending flags
   */
  getPendingCount: adminProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: count() })
      .from(moderationFlags)
      .where(eq(moderationFlags.status, 'pending'));

    return result[0]?.count ?? 0;
  }),

  /**
   * Flag content (internal use - called by system when profanity detected)
   */
  flagContent: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(['bounty', 'comment', 'submission']),
        contentId: z.string().min(1),
        reason: z.string().min(1).max(500),
        flaggedText: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [flag] = await ctx.db
        .insert(moderationFlags)
        .values({
          contentType: input.contentType,
          contentId: input.contentId,
          reason: input.reason,
          flaggedText: input.flaggedText,
          status: 'auto_flagged',
        })
        .returning();

      return flag;
    }),

  /**
   * Admin: Review and resolve a moderation flag
   */
  reviewFlag: adminProcedure
    .input(
      z.object({
        flagId: z.string().min(1),
        status: z.enum(['approved', 'rejected']),
        reviewNotes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the flag exists
      const [existingFlag] = await ctx.db
        .select()
        .from(moderationFlags)
        .where(eq(moderationFlags.id, input.flagId))
        .limit(1);

      if (!existingFlag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Moderation flag not found',
        });
      }

      const [updatedFlag] = await ctx.db
        .update(moderationFlags)
        .set({
          status: input.status,
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(moderationFlags.id, input.flagId))
        .returning();

      // Track admin event
      void trackAdminEvent('admin_action', {
        actorId: ctx.session.user.id,
        targetType: existingFlag.contentType as 'bounty' | 'comment' | 'submission' | 'user',
        targetId: existingFlag.contentId,
        description: `${ctx.session.user.name || 'Admin'} ${input.status === 'approved' ? 'approved' : 'dismissed'} ${existingFlag.contentType} report`,
        metadata: {
          flagId: input.flagId,
          action: input.status,
          reviewNotes: input.reviewNotes,
        },
      });

      return updatedFlag;
    }),

  /**
   * Get a single flag by ID
   */
  getFlag: adminProcedure
    .input(z.object({ flagId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [flag] = await ctx.db
        .select()
        .from(moderationFlags)
        .where(eq(moderationFlags.id, input.flagId))
        .limit(1);

      if (!flag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Moderation flag not found',
        });
      }

      return flag;
    }),

  /**
   * User-facing: Report content for review
   * This creates a moderation flag and tracks the event for admin visibility
   */
  reportContent: protectedProcedure
    .input(
      z.object({
        contentType: z.enum(['bounty', 'comment', 'submission', 'user']),
        contentId: z.string().min(1), // Can be UUID or cuid2 (for users)
        reason: z
          .enum(['spam', 'harassment', 'inappropriate', 'scam', 'other'])
          .default('other'),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the content exists and get info for tracking
      let contentExists = false;
      let contentOwnerId: string | null = null;
      let contentPreview: string | null = null;

      if (input.contentType === 'bounty') {
        const [found] = await ctx.db
          .select({
            id: bounty.id,
            createdById: bounty.createdById,
            title: bounty.title,
          })
          .from(bounty)
          .where(eq(bounty.id, input.contentId))
          .limit(1);
        contentExists = !!found;
        contentOwnerId = found?.createdById ?? null;
        contentPreview = found?.title ?? null;
      } else if (input.contentType === 'comment') {
        const [found] = await ctx.db
          .select({
            id: bountyComment.id,
            userId: bountyComment.userId,
            content: bountyComment.content,
          })
          .from(bountyComment)
          .where(eq(bountyComment.id, input.contentId))
          .limit(1);
        contentExists = !!found;
        contentOwnerId = found?.userId ?? null;
        contentPreview = found?.content?.slice(0, 100) ?? null;
      } else if (input.contentType === 'submission') {
        const [found] = await ctx.db
          .select({
            id: submission.id,
            contributorId: submission.contributorId,
            description: submission.description,
          })
          .from(submission)
          .where(eq(submission.id, input.contentId))
          .limit(1);
        contentExists = !!found;
        contentOwnerId = found?.contributorId ?? null;
        contentPreview = found?.description?.slice(0, 100) ?? null;
      } else if (input.contentType === 'user') {
        const [found] = await ctx.db
          .select({
            id: user.id,
            name: user.name,
            handle: user.handle,
          })
          .from(user)
          .where(eq(user.id, input.contentId))
          .limit(1);
        contentExists = !!found;
        contentOwnerId = found?.id ?? null; // The user IS the owner
        contentPreview = found?.handle ?? found?.name ?? null;
      }

      if (!contentExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      // Don't allow reporting your own content
      if (contentOwnerId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot report your own content',
        });
      }

      // Check if this user already reported this content
      const [existingReport] = await ctx.db
        .select({ id: moderationFlags.id })
        .from(moderationFlags)
        .where(
          and(
            eq(moderationFlags.contentType, input.contentType),
            eq(moderationFlags.contentId, input.contentId),
            eq(moderationFlags.reporterId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (existingReport) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already reported this content',
        });
      }

      // Create the moderation flag
      const reasonText = input.description
        ? `${input.reason}: ${input.description}`
        : input.reason;

      const [flag] = await ctx.db
        .insert(moderationFlags)
        .values({
          contentType: input.contentType,
          contentId: input.contentId,
          reason: reasonText,
          flaggedText: contentPreview ?? null,
          status: 'pending',
          reporterId: ctx.session.user.id,
        })
        .returning();

      if (!flag) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create report',
        });
      }

      // Get reporter name for tracking
      const [reporter] = await ctx.db
        .select({ name: user.name, handle: user.handle })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      const reporterName =
        reporter?.handle ?? reporter?.name ?? 'A user';

      // Track the report event for admin activity feed (fire and forget)
      try {
        void trackAdminEvent('content_reported', {
          actorId: ctx.session.user.id,
          targetType: input.contentType,
          targetId: input.contentId,
          description: `${reporterName} reported a ${input.contentType} for ${input.reason}`,
          metadata: {
            reason: input.reason,
            contentOwnerId: contentOwnerId ?? undefined,
            flagId: flag.id,
          },
        });
      } catch {
        // Ignore tracking errors - the report was still created
      }

      return {
        success: true,
        message: 'Content reported successfully. Our team will review it.',
      };
    }),
});
