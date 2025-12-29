import {
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  createNotification,
  db,
  submission,
  user,
} from '@bounty/db';
import { track } from '@bounty/track';
import { TRPCError } from '@trpc/server';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { z } from 'zod';
import { LRUCache } from '../lib/lru-cache';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { realtime } from '@bounty/realtime';

const parseAmount = (amount: string | number | null): number => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  const parsed = Number(amount);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const createBountySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.'),
  currency: z.string().default('USD'),
  deadline: z
    .string()
    .datetime('Deadline must be a valid date')
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        if (isNaN(date.getTime())) return false; // Invalid date
        // Compare dates (ignore time for day-level comparison)
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowOnly = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        return dateOnly >= nowOnly; // Must be today or in the future
      },
      {
        message: 'Deadline must be today or in the future',
      }
    ),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional(),
  issueUrl: z.string().url().optional(),
});

const updateBountySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),

  amount: z
    .string()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.')
    .optional(),
  currency: z.string().optional(),
  deadline: z
    .string()
    .datetime('Deadline must be a valid date')
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        if (isNaN(date.getTime())) return false; // Invalid date
        // Compare dates (ignore time for day-level comparison)
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowOnly = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        return dateOnly >= nowOnly; // Must be today or in the future
      },
      {
        message: 'Deadline must be today or in the future',
      }
    ),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional(),
  issueUrl: z.string().url().optional(),
  status: z
    .enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'])
    .optional(),
});

const getBountiesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z
    .enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(['created_at', 'amount', 'deadline', 'title'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const submitBountyApplicationSchema = z.object({
  bountyId: z.string().uuid(),
  message: z
    .string()
    .min(10, 'Application message must be at least 10 characters'),
});

const submitBountyWorkSchema = z.object({
  bountyId: z.string().uuid(),
  description: z
    .string()
    .min(10, 'Submission description must be at least 10 characters'),
  deliverableUrl: z.string().url('Invalid deliverable URL'),
  pullRequestUrl: z.string().url().optional(),
});

// LRU Cache for bounty statistics (cache for 5 minutes)
const bountyStatsCache = new LRUCache<{
  totalBounties: number;
  activeBounties: number;
  totalBountiesValue: number;
  totalPayout: number;
}>({
  maxSize: 1,
  ttl: 5 * 60 * 1000, // 5 minutes
});

// LRU Cache for individual bounty details (cache for 2 minutes, max 100 items)
const bountyDetailCache = new LRUCache<{
  bounty: unknown;
  votes: { count: number; isVoted: boolean };
  bookmarked: boolean;
  comments: unknown[];
}>({
  maxSize: 100,
  ttl: 2 * 60 * 1000, // 2 minutes
});

// LRU Cache for bounty lists (cache for 1 minute, max 50 different queries)
const bountyListCache = new LRUCache<{
  success: boolean;
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>({
  maxSize: 50,
  ttl: 60 * 1000, // 1 minute
});

export const bountiesRouter = router({
  getBountyStats: publicProcedure.query(async () => {
    try {
      // Check cache first
      const cacheKey = 'bounty_stats';
      const cached = bountyStatsCache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }

      const totalBountiesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bounty);

      const activeBountiesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bounty)
        .where(eq(bounty.status, 'open'));

      const totalBountiesValueResult = await db
        .select({
          total: sql<number>`coalesce(sum(cast(${bounty.amount} as decimal)), 0)`,
        })
        .from(bounty)
        .where(eq(bounty.status, 'open'));

      const totalPayoutResult = await db
        .select({
          total: sql<number>`coalesce(sum(cast(${bounty.amount} as decimal)), 0)`,
        })
        .from(bounty)
        .where(eq(bounty.status, 'completed'));

      const stats = {
        totalBounties: totalBountiesResult[0]?.count ?? 0,
        activeBounties: activeBountiesResult[0]?.count ?? 0,
        totalBountiesValue: Number(totalBountiesValueResult[0]?.total) || 0,
        totalPayout: Number(totalPayoutResult[0]?.total) || 0,
      };

      // Cache the result
      bountyStatsCache.set(cacheKey, stats);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch bounty statistics',
        cause: error,
      });
    }
  }),

  createBounty: protectedProcedure
    .input(createBountySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const normalizedAmount = String(input.amount);
        const cleanedTags =
          Array.isArray(input.tags) && input.tags.length > 0
            ? input.tags
            : undefined;
        const repositoryUrl =
          input.repositoryUrl && input.repositoryUrl.length > 0
            ? input.repositoryUrl
            : undefined;
        const issueUrl =
          input.issueUrl && input.issueUrl.length > 0
            ? input.issueUrl
            : undefined;
        const deadline = input.deadline ? new Date(input.deadline) : undefined;

        const newBountyResult = await db
          .insert(bounty)
          .values({
            title: input.title,
            description: input.description,
            amount: normalizedAmount,
            currency: input.currency,
            deadline,
            tags: cleanedTags ?? null,
            repositoryUrl,
            issueUrl,
            createdById: ctx.session.user.id,
            status: 'open',
          })
          .returning();

        const newBounty = newBountyResult[0];
        if (!newBounty) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create bounty',
          });
        }

        try {
          await track('bounty_created', {
            bounty_id: newBounty.id,
            user_id: ctx.session.user.id,
            amount: parseAmount(normalizedAmount),
            currency: input.currency,
            has_repo: Boolean(repositoryUrl),
            has_issue: Boolean(issueUrl),
            tags_count: cleanedTags?.length ?? 0,
            source: 'api',
          });
        } catch {
          // ignore
        }

        // Invalidate caches
        bountyStatsCache.clear();
        bountyListCache.clear();

        return {
          success: true,
          data: newBounty,
          message: 'Bounty created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bounty',
          cause: error,
        });
      }
    }),

  fetchAllBounties: protectedProcedure
    .input(getBountiesSchema)
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        const conditions = [];

        if (input.status) {
          conditions.push(eq(bounty.status, input.status));
        }

        if (input.search) {
          conditions.push(
            or(
              ilike(bounty.title, `%${input.search}%`),
              ilike(bounty.description, `%${input.search}%`)
            )
          );
        }

        if (input.tags && input.tags.length > 0) {
          conditions.push(sql`${bounty.tags} && ${input.tags}`);
        }

        const results = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            isFeatured: bounty.isFeatured,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(
            input.sortOrder === 'asc'
              ? bounty.createdAt
              : desc(bounty.createdAt)
          )
          .limit(input.limit)
          .offset(offset);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(bounty)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const count = countResult[0]?.count ?? 0;

        const processedResults = results.map((result) => ({
          ...result,
          amount: parseAmount(result.amount),
        }));

        return {
          success: true,
          data: processedResults,
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
          message: 'Failed to fetch bounties',
          cause: error,
        });
      }
    }),

  fetchBountyById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const [result] = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            // requirements: bounty.requirements,
            // deliverables: bounty.deliverables,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            issueUrl: bounty.issueUrl,
            isFeatured: bounty.isFeatured,
            createdById: bounty.createdById,
            assignedToId: bounty.assignedToId,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(eq(bounty.id, input.id));

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        return {
          success: true,
          data: {
            ...result,
            amount: parseAmount(result.amount),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bounty',
          cause: error,
        });
      }
    }),

  randomBounty: publicProcedure.query(async ({ ctx }) => {
    try {
      const [result] = await ctx.db
        .select({
          id: bounty.id,
          title: bounty.title,
          description: bounty.description,
          amount: bounty.amount,
          currency: bounty.currency,
          status: bounty.status,
          deadline: bounty.deadline,
          tags: bounty.tags,
          repositoryUrl: bounty.repositoryUrl,
          issueUrl: bounty.issueUrl,
          createdById: bounty.createdById,
          createdAt: bounty.createdAt,
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(bounty)
        .innerJoin(user, eq(bounty.createdById, user.id))
        .where(eq(bounty.status, 'open'))
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No open bounties available',
        });
      }

      return {
        success: true,
        data: {
          ...result,
          amount: parseAmount(result.amount),
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch random bounty',
        cause: error,
      });
    }
  }),

  getBountiesByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const results = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            issueUrl: bounty.issueUrl,
            isFeatured: bounty.isFeatured,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(eq(bounty.createdById, input.userId))
          .orderBy(desc(bounty.createdAt));
        return {
          success: true,
          data: results.map((r) => ({ ...r, amount: parseAmount(r.amount) })),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bounties',
          cause: error,
        });
      }
    }),

  getHighlights: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const results = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            issueUrl: bounty.issueUrl,
            isFeatured: bounty.isFeatured,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(
            and(
              eq(bounty.createdById, input.userId),
              eq(bounty.isFeatured, true)
            )
          )
          .orderBy(desc(bounty.createdAt));

        return {
          success: true,
          data: results.map((r) => ({ ...r, amount: parseAmount(r.amount) })),
        };
      } catch (error) {
        // If isFeatured column doesn't exist, return empty array
        console.error('Error fetching highlights:', error);
        return {
          success: true,
          data: [],
        };
      }
    }),

  toggleBountyPin: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select({ createdById: bounty.createdById, isFeatured: bounty.isFeatured })
          .from(bounty)
          .where(eq(bounty.id, input.bountyId))
          .limit(1);

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only pin your own bounties',
          });
        }

        const newFeaturedValue = !existingBounty.isFeatured;

        await db
          .update(bounty)
          .set({ 
            isFeatured: newFeaturedValue,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          isFeatured: newFeaturedValue,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle pin',
          cause: error,
        });
      }
    }),

  updateBounty: protectedProcedure
    .input(updateBountySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, id));

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own bounties',
          });
        }

        const updatedBountyResult = await db
          .update(bounty)
          .set({
            ...updateData,
            deadline: updateData.deadline
              ? new Date(updateData.deadline)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, id))
          .returning();

        const updatedBounty = updatedBountyResult[0];
        if (!updatedBounty) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update bounty',
          });
        }

        try {
          await track('bounty_updated', {
            bounty_id: updatedBounty.id,
            user_id: ctx.session.user.id,
            amount: parseAmount(updatedBounty.amount),
            currency: input.currency,
            has_repo: Boolean(updatedBounty.repositoryUrl),
            has_issue: Boolean(updatedBounty.issueUrl),
            tags_count: updatedBounty.tags?.length ?? 0,
            source: 'api',
          });
        } catch {}

        // Invalidate caches
        bountyStatsCache.clear();
        bountyListCache.clear();
        bountyDetailCache.delete(id);

        return {
          success: true,
          data: updatedBounty,
          message: 'Bounty updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update bounty',
          cause: error,
        });
      }
    }),

  deleteBounty: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.id));

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own bounties',
          });
        }

        await db.delete(bounty).where(eq(bounty.id, input.id));

        try {
          await track('bounty_deleted', {
            bounty_id: input.id,
            user_id: ctx.session.user.id,
            source: 'api',
          });
        } catch {}

        // Invalidate caches
        bountyStatsCache.clear();
        bountyListCache.clear();
        bountyDetailCache.delete(input.id);

        return {
          success: true,
          message: 'Bounty deleted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete bounty',
          cause: error,
        });
      }
    }),

  voteBounty: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existing] = await db
          .select()
          .from(bountyVote)
          .where(
            and(
              eq(bountyVote.bountyId, input.bountyId),
              eq(bountyVote.userId, ctx.session.user.id)
            )
          );

        try {
          await track('bounty_voted', {
            bounty_id: input.bountyId,
            user_id: ctx.session.user.id,
            voted: Boolean(existing),
            source: 'api',
          });
        } catch {}

        let voted = false;
        if (existing) {
          await db
            .delete(bountyVote)
            .where(
              and(
                eq(bountyVote.bountyId, input.bountyId),
                eq(bountyVote.userId, ctx.session.user.id)
              )
            );
          voted = false;
        } else {
          await db.insert(bountyVote).values({
            bountyId: input.bountyId,
            userId: ctx.session.user.id,
          });
          voted = true;
        }

        const [countRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bountyVote)
          .where(eq(bountyVote.bountyId, input.bountyId));

        return { voted, count: countRes?.count ?? 0 };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle vote',
          cause: error,
        });
      }
    }),

  getBountyVotes: publicProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [countRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bountyVote)
          .where(eq(bountyVote.bountyId, input.bountyId));

        let isVoted = false;
        if (ctx.session?.user?.id) {
          const [existing] = await db
            .select({ id: bountyVote.id })
            .from(bountyVote)
            .where(
              and(
                eq(bountyVote.bountyId, input.bountyId),
                eq(bountyVote.userId, ctx.session.user.id)
              )
            );
          isVoted = Boolean(existing);
        }

        return { count: countRes?.count ?? 0, isVoted };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch votes',
          cause: error,
        });
      }
    }),

  getBountyDetail: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [bountyRow] = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            issueUrl: bounty.issueUrl,
            createdById: bounty.createdById,
            assignedToId: bounty.assignedToId,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(eq(bounty.id, input.id));
        if (!bountyRow) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        const [voteCountRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(bountyVote)
          .where(eq(bountyVote.bountyId, input.id));

        let isVoted = false;
        let bookmarked = false;
        if (ctx.session?.user?.id) {
          const [existingVote] = await db
            .select({ id: bountyVote.id })
            .from(bountyVote)
            .where(
              and(
                eq(bountyVote.bountyId, input.id),
                eq(bountyVote.userId, ctx.session.user.id)
              )
            );
          isVoted = Boolean(existingVote);

          const [existingBookmark] = await db
            .select({ id: bountyBookmark.id })
            .from(bountyBookmark)
            .where(
              and(
                eq(bountyBookmark.bountyId, input.id),
                eq(bountyBookmark.userId, ctx.session.user.id)
              )
            );
          bookmarked = Boolean(existingBookmark);
        }

        const comments = await db
          .select({
            id: bountyComment.id,
            content: bountyComment.content,
            originalContent: bountyComment.originalContent,
            parentId: bountyComment.parentId,
            createdAt: bountyComment.createdAt,
            editCount: bountyComment.editCount,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bountyComment)
          .leftJoin(user, eq(bountyComment.userId, user.id))
          .where(eq(bountyComment.bountyId, input.id))
          .orderBy(desc(bountyComment.createdAt));

        const commentIds = comments.map((c) => c.id);
        const likeCounts = commentIds.length
          ? await db
              .select({
                commentId: bountyCommentLike.commentId,
                likeCount: sql<number>`count(*)::int`.as('likeCount'),
              })
              .from(bountyCommentLike)
              .where(inArray(bountyCommentLike.commentId, commentIds))
              .groupBy(bountyCommentLike.commentId)
          : [];

        const userLikes =
          ctx.session?.user?.id && commentIds.length
            ? await db
                .select({ commentId: bountyCommentLike.commentId })
                .from(bountyCommentLike)
                .where(
                  and(
                    eq(bountyCommentLike.userId, ctx.session.user.id),
                    inArray(bountyCommentLike.commentId, commentIds)
                  )
                )
            : [];

        const commentsWithLikes = comments.map((c) => {
          const lc = likeCounts.find((x) => x.commentId === c.id);
          const isLiked = (userLikes || []).some((x) => x.commentId === c.id);
          return {
            ...c,
            originalContent: c.originalContent ?? null,
            likeCount: lc?.likeCount || 0,
            isLiked,
          } as const;
        });

        return {
          bounty: { ...bountyRow, amount: parseAmount(bountyRow.amount) },
          votes: { count: Number(voteCountRow?.count || 0), isVoted },
          bookmarked,
          comments: commentsWithLikes,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bounty detail',
          cause: error,
        });
      }
    }),
  toggleBountyBookmark: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const inserted = await db
          .insert(bountyBookmark)
          .values({ bountyId: input.bountyId, userId: ctx.session.user.id })
          .onConflictDoNothing({
            target: [bountyBookmark.bountyId, bountyBookmark.userId],
          })
          .returning();

        if (inserted.length === 0) {
          await db
            .delete(bountyBookmark)
            .where(
              and(
                eq(bountyBookmark.bountyId, input.bountyId),
                eq(bountyBookmark.userId, ctx.session.user.id)
              )
            );
          try {
            await track('bounty_bookmark_toggled', {
              bounty_id: input.bountyId,
              user_id: ctx.session.user.id,
              bookmarked: false,
              source: 'api',
            });
          } catch {}
          return { bookmarked: false };
        }
        try {
          await track('bounty_bookmark_toggled', {
            bounty_id: input.bountyId,
            user_id: ctx.session.user.id,
            bookmarked: true,
            source: 'api',
          });
        } catch {}
        return { bookmarked: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle bookmark',
          cause: error,
        });
      }
    }),

  getBountyBookmark: publicProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.session?.user?.id) {
          return { bookmarked: false };
        }
        const [existing] = await db
          .select({ id: bountyBookmark.id })
          .from(bountyBookmark)
          .where(
            and(
              eq(bountyBookmark.bountyId, input.bountyId),
              eq(bountyBookmark.userId, ctx.session.user.id)
            )
          );
        return { bookmarked: Boolean(existing) };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bookmark',
          cause: error,
        });
      }
    }),

  getBountyStatsMany: publicProcedure
    .input(z.object({ bountyIds: z.array(z.string().uuid()).min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      try {
        const ids = input.bountyIds;
        const commentRows = await db
          .select({
            bountyId: bountyComment.bountyId,
            count: sql<number>`count(*)::int`,
          })
          .from(bountyComment)
          .where(inArray(bountyComment.bountyId, ids))
          .groupBy(bountyComment.bountyId);

        const voteRows = await db
          .select({
            bountyId: bountyVote.bountyId,
            count: sql<number>`count(*)::int`,
          })
          .from(bountyVote)
          .where(inArray(bountyVote.bountyId, ids))
          .groupBy(bountyVote.bountyId);

        let userVotes: { bountyId: string }[] = [];
        let userBookmarks: { bountyId: string }[] = [];

        if (ctx.session?.user?.id) {
          userVotes = await db
            .select({ bountyId: bountyVote.bountyId })
            .from(bountyVote)
            .where(
              and(
                eq(bountyVote.userId, ctx.session.user.id),
                inArray(bountyVote.bountyId, ids)
              )
            );

          userBookmarks = await db
            .select({ bountyId: bountyBookmark.bountyId })
            .from(bountyBookmark)
            .where(
              and(
                eq(bountyBookmark.userId, ctx.session.user.id),
                inArray(bountyBookmark.bountyId, ids)
              )
            );
        }

        const out = ids.map((id) => {
          const c = commentRows.find((r) => r.bountyId === id)?.count ?? 0;
          const v = voteRows.find((r) => r.bountyId === id)?.count ?? 0;
          const isVoted = userVotes.some((r) => r.bountyId === id);
          const bookmarked = userBookmarks.some((r) => r.bountyId === id);
          return {
            bountyId: id,
            commentCount: c,
            voteCount: v,
            isVoted,
            bookmarked,
          };
        });

        return { stats: out };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bounty stats',
          cause: error,
        });
      }
    }),

  listBookmarkedBounties: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 20;
        const offset = (page - 1) * limit;

        const rows = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bountyBookmark)
          .innerJoin(bounty, eq(bountyBookmark.bountyId, bounty.id))
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(eq(bountyBookmark.userId, ctx.session.user.id))
          .orderBy(desc(bountyBookmark.createdAt))
          .limit(limit)
          .offset(offset);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(bountyBookmark)
          .where(eq(bountyBookmark.userId, ctx.session.user.id));

        const count = countResult[0]?.count ?? 0;

        return {
          success: true,
          data: rows.map((r) => ({ ...r, amount: parseAmount(r.amount) })),
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list bookmarks',
          cause: error,
        });
      }
    }),

  addBountyComment: protectedProcedure
    .input(
      z.object({
        bountyId: z.string().uuid(),
        content: z.string().min(1).max(245),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const trimmed = input.content.trim();

        if (input.parentId) {
          const [dupCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(bountyComment)
            .where(
              and(
                eq(bountyComment.bountyId, input.bountyId),
                eq(bountyComment.userId, ctx.session.user.id),
                isNotNull(bountyComment.parentId),
                eq(bountyComment.content, trimmed)
              )
            );
          if ((dupCount?.count ?? 0) >= 2) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Duplicate reply limit reached (2 per bounty)',
            });
          }
        } else {
          const [existing] = await db
            .select({ id: bountyComment.id })
            .from(bountyComment)
            .where(
              and(
                eq(bountyComment.bountyId, input.bountyId),
                eq(bountyComment.userId, ctx.session.user.id),
                isNull(bountyComment.parentId),
                eq(bountyComment.content, trimmed)
              )
            )
            .limit(1);
          if (existing) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Duplicate comment on this bounty',
            });
          }
        }

        const [inserted] = await db
          .insert(bountyComment)
          .values({
            bountyId: input.bountyId,
            userId: ctx.session.user.id,
            content: trimmed,
            parentId: input.parentId,
          })
          .returning();

        if (!inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create comment',
          });
        }

        try {
          await track('bounty_comment_added', {
            bounty_id: input.bountyId,
            comment_id: inserted.id,
            user_id: ctx.session.user.id,
            parent_id: input.parentId ?? undefined,
            content_length: trimmed.length,
            source: 'api',
          });
        } catch {}

        try {
          const [owner] = await db
            .select({ createdById: bounty.createdById, title: bounty.title })
            .from(bounty)
            .where(eq(bounty.id, input.bountyId))
            .limit(1);
          if (owner?.createdById && owner.createdById !== ctx.session.user.id) {
            await createNotification({
              userId: owner.createdById,
              type: 'bounty_comment',
              title: `New comment on "${owner.title}"`,
              message:
                trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed,
              data: { bountyId: input.bountyId, commentId: inserted.id },
            });
            await realtime.emit('notifications.refresh', {
              userId: owner.createdById,
              ts: Date.now(),
            });
          }
        } catch (_e) {}

        return inserted;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (
          error instanceof Error &&
          (error.message.includes('unique constraint') ||
            error.message.includes('duplicate key value'))
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Duplicate comment on this bounty',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add comment',
          cause: error,
        });
      }
    }),

  getBountyComments: publicProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const comments = await db
          .select({
            id: bountyComment.id,
            content: bountyComment.content,
            originalContent: bountyComment.originalContent,
            parentId: bountyComment.parentId,
            createdAt: bountyComment.createdAt,
            editCount: bountyComment.editCount,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bountyComment)
          .leftJoin(user, eq(bountyComment.userId, user.id))
          .where(eq(bountyComment.bountyId, input.bountyId))
          .orderBy(desc(bountyComment.createdAt));

        const ids = comments.map((c) => c.id);
        const likeCounts = ids.length
          ? await db
              .select({
                commentId: bountyCommentLike.commentId,
                likeCount: sql<number>`count(*)::int`.as('likeCount'),
              })
              .from(bountyCommentLike)
              .where(inArray(bountyCommentLike.commentId, ids))
              .groupBy(bountyCommentLike.commentId)
          : [];

        const userLikes =
          ctx.session?.user?.id && ids.length
            ? await db
                .select({ commentId: bountyCommentLike.commentId })
                .from(bountyCommentLike)
                .where(
                  and(
                    eq(bountyCommentLike.userId, ctx.session.user.id),
                    inArray(bountyCommentLike.commentId, ids)
                  )
                )
            : [];

        const withLikes = comments.map((c) => {
          const lc = likeCounts.find((x) => x.commentId === c.id);
          const isLiked = (userLikes || []).some((x) => x.commentId === c.id);
          return {
            ...c,
            originalContent: c.originalContent ?? null,
            likeCount: lc?.likeCount || 0,
            isLiked,
          } as const;
        });

        return withLikes;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch comments',
          cause: error,
        });
      }
    }),

  updateBountyComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
        content: z.string().min(1).max(245),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [existing] = await db
          .select()
          .from(bountyComment)
          .where(eq(bountyComment.id, input.commentId));

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }
        if (existing.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not your comment',
          });
        }
        if (existing.editCount >= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Edit limit reached',
          });
        }

        const trimmed = input.content.trim();
        if (existing.content.trim() === trimmed) {
          return existing;
        }

        const updatedResult = await db
          .update(bountyComment)
          .set({
            content: trimmed,
            originalContent: existing.originalContent ?? existing.content,
            editCount: sql`(${bountyComment.editCount} + 1)`,
            updatedAt: new Date(),
          })
          .where(eq(bountyComment.id, input.commentId))
          .returning();

        const updated = updatedResult[0];
        if (!updated) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update comment',
          });
        }

        try {
          await track('bounty_comment_updated', {
            comment_id: updated.id,
            bounty_id: updated.bountyId,
            user_id: ctx.session.user.id,
            edit_count: updated.editCount,
            source: 'api',
          });
        } catch {}
        return updated;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update comment',
          cause: error,
        });
      }
    }),

  deleteBountyComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existing] = await db
          .select()
          .from(bountyComment)
          .where(eq(bountyComment.id, input.commentId));

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }
        if (existing.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not your comment',
          });
        }

        await db
          .delete(bountyComment)
          .where(eq(bountyComment.id, input.commentId));
        try {
          await track('bounty_comment_deleted', {
            comment_id: input.commentId,
            bounty_id: existing.bountyId,
            user_id: ctx.session.user.id,
            source: 'api',
          });
        } catch {}
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete comment',
          cause: error,
        });
      }
    }),

  toggleCommentLike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const inserted = await db
          .insert(bountyCommentLike)
          .values({ commentId: input.commentId, userId: ctx.session.user.id })
          .onConflictDoNothing({
            target: [bountyCommentLike.commentId, bountyCommentLike.userId],
          })
          .returning();

        if (inserted.length === 0) {
          await db
            .delete(bountyCommentLike)
            .where(
              and(
                eq(bountyCommentLike.commentId, input.commentId),
                eq(bountyCommentLike.userId, ctx.session.user.id)
              )
            );
        }

        const [countRes] = await db
          .select({ likeCount: sql<number>`count(*)::int` })
          .from(bountyCommentLike)
          .where(eq(bountyCommentLike.commentId, input.commentId));
        try {
          await track('bounty_comment_like_toggled', {
            comment_id: input.commentId,
            user_id: ctx.session.user.id,
            liked: inserted.length > 0,
            source: 'api',
          });
        } catch {}
        return {
          likeCount: countRes?.likeCount || 0,
          isLiked: inserted.length > 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle like',
          cause: error,
        });
      }
    }),

  applyToBounty: protectedProcedure
    .input(submitBountyApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId));

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (existingBounty.status !== 'open') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot apply to a bounty that is not open',
          });
        }

        const [existingApplication] = await db
          .select()
          .from(bountyApplication)
          .where(
            and(
              eq(bountyApplication.bountyId, input.bountyId),
              eq(bountyApplication.applicantId, ctx.session.user.id)
            )
          );

        if (existingApplication) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You have already applied to this bounty',
          });
        }

        const [newApplication] = await db
          .insert(bountyApplication)
          .values({
            ...input,
            applicantId: ctx.session.user.id,
          })
          .returning();

        return {
          success: true,
          data: newApplication,
          message: 'Application submitted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit application',
          cause: error,
        });
      }
    }),

  submitBountyWork: protectedProcedure
    .input(submitBountyWorkSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId));

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        if (existingBounty.assignedToId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not assigned to this bounty',
          });
        }

        const [newSubmission] = await db
          .insert(submission)
          .values({
            ...input,
            contributorId: ctx.session.user.id,
          })
          .returning();

        await db
          .update(bounty)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          data: newSubmission,
          message: 'Work submitted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit work',
          cause: error,
        });
      }
    }),

  fetchMyBounties: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        status: z
          .enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(bounty.createdById, ctx.session.user.id)];

        if (input.status) {
          conditions.push(eq(bounty.status, input.status));
        }

        const results = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            // requirements: bounty.requirements,
            // deliverables: bounty.deliverables,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            issueUrl: bounty.issueUrl,
            createdById: bounty.createdById,
            assignedToId: bounty.assignedToId,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
            creator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(bounty)
          .innerJoin(user, eq(bounty.createdById, user.id))
          .where(and(...conditions))
          .orderBy(desc(bounty.createdAt))
          .limit(input.limit)
          .offset(offset);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(bounty)
          .where(eq(bounty.createdById, ctx.session.user.id));

        const count = countResult[0]?.count ?? 0;

        const processedResults = results.map((result) => ({
          ...result,
          amount: parseAmount(result.amount),
        }));

        return {
          success: true,
          data: processedResults,
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
          message: 'Failed to fetch your bounties',
          cause: error,
        });
      }
    }),
});
