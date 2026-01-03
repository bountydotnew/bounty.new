import {
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  createNotification,
  db,
  payout,
  submission,
  transaction,
  user,
} from '@bounty/db';
import { track } from '@bounty/track';
import { TRPCError } from '@trpc/server';
import {
  createBountyCheckoutSession,
  capturePayment,
  createTransfer,
  refundPayment,
  calculateTotalWithFees,
} from '@bounty/stripe';
import { stripeClient } from '@bounty/stripe';
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

// Output schemas for OpenAPI documentation
const bountyStatsOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalBounties: z.number(),
    activeBounties: z.number(),
    totalBountiesValue: z.number(),
    totalPayout: z.number(),
  }),
});

const creatorSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

const bountyOutputSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled']),
  deadline: z.date().nullable(),
  tags: z.array(z.string()).nullable(),
  repositoryUrl: z.string().nullable(),
  issueUrl: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  createdById: z.string(),
  assignedToId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  creator: creatorSchema,
});

const createBountyOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    amount: z.string(),
    currency: z.string(),
    status: z.string(),
    deadline: z.date().nullable(),
    tags: z.array(z.string()).nullable(),
    repositoryUrl: z.string().nullable(),
    issueUrl: z.string().nullable(),
    createdById: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  message: z.string(),
  checkoutUrl: z.string().nullable().optional(),
  fees: z.number().optional(),
  totalWithFees: z.number().optional(),
  payLater: z.boolean().optional(),
});

const bountyListOutputSchema = z.object({
  success: z.boolean(),
  data: z.array(bountyOutputSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const singleBountyOutputSchema = z.object({
  success: z.boolean(),
  data: bountyOutputSchema,
});

const deleteBountyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const bountyVotesOutputSchema = z.object({
  count: z.number(),
  isVoted: z.boolean(),
});

const commentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  originalContent: z.string().nullable(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
  editCount: z.number().nullable(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }).nullable(),
  likeCount: z.number(),
  isLiked: z.boolean(),
});

const bountyDetailOutputSchema = z.object({
  bounty: bountyOutputSchema,
  votes: bountyVotesOutputSchema,
  bookmarked: z.boolean(),
  comments: z.array(commentSchema),
});
/**
 * Ensure a Stripe customer exists for a user
 * Creates one if it doesn't exist, returns existing if it does
 * Verifies the customer exists in Stripe and recreates if needed
 */
async function ensureStripeCustomer(
  userId: string,
  email: string,
  name: string | null
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const [existingUser] = await db
    .select({ stripeCustomerId: user.stripeCustomerId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (existingUser?.stripeCustomerId) {
    // Verify the customer exists in Stripe
    try {
      await stripeClient.customers.retrieve(existingUser.stripeCustomerId);
      return existingUser.stripeCustomerId;
    } catch (error) {
      // Customer doesn't exist in Stripe (deleted, wrong environment, etc.)
      // Create a new one and update the database
      console.warn(
        `Stripe customer ${existingUser.stripeCustomerId} not found, creating new customer for user ${userId}`
      );
    }
  }

  // Create new Stripe customer
  const customer = await stripeClient.customers.create({
    email,
    name: name || email,
    metadata: { userId },
  });

  // Update user record with Stripe customer ID
  await db
    .update(user)
    .set({ stripeCustomerId: customer.id })
    .where(eq(user.id, userId));

  return customer.id;
}

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
  payLater: z.boolean().optional().default(false), // Allow creating bounty without payment
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
  creatorId: z.string().uuid().optional(),
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
  getBountyStats: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties/stats',
        summary: 'Get bounty statistics',
        description: 'Returns platform-wide bounty statistics including total bounties, active bounties, and payout information',
        tags: ['Bounties'],
      },
    })
    .input(z.void())
    .output(bountyStatsOutputSchema)
    .query(async () => {
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
    .meta({
      openapi: {
        method: 'POST',
        path: '/bounties',
        summary: 'Create a new bounty',
        description: 'Creates a new bounty with the provided details. Requires authentication.',
        tags: ['Bounties'],
        protect: true,
      },
    })
    .input(createBountySchema)
    .output(createBountyOutputSchema)
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
        const payLater = input.payLater ?? false;

        // Calculate fees
        const bountyAmountInCents = Math.round(parseAmount(normalizedAmount) * 100);
        const { total: totalWithFees, fees } = calculateTotalWithFees(bountyAmountInCents);

        let checkoutSessionUrl = null;

        // If not paying later, require payment upfront
        if (!payLater) {
          // Ensure user has Stripe customer ID
          const userEmail = ctx.session.user.email;
          if (!userEmail) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'User email is required to create a bounty with payment',
            });
          }

          const stripeCustomerId = await ensureStripeCustomer(
            ctx.session.user.id,
            userEmail,
            ctx.session.user.name
          );

          // Create Checkout Session - will be created after bounty is saved
          // We'll update this after bounty creation
        }

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
            status: 'draft', // Draft until payment confirmed
            stripePaymentIntentId: null, // Will be set via webhook
            paymentStatus: 'pending',
          })
          .returning();

        const newBounty = newBountyResult[0];
        if (!newBounty) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create bounty',
          });
        }

        // Create Checkout Session if not paying later
        if (!payLater) {
          const userEmail = ctx.session.user.email!;
          const stripeCustomerId = await ensureStripeCustomer(
            ctx.session.user.id,
            userEmail,
            ctx.session.user.name
          );

          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const checkoutSession = await createBountyCheckoutSession({
            bountyId: newBounty.id,
            amount: bountyAmountInCents,
            fees,
            currency: input.currency,
            customerId: stripeCustomerId,
            successUrl: `${baseUrl}/bounty/${newBounty.id}`,
            cancelUrl: `${baseUrl}/bounty/${newBounty.id}?payment=cancelled`,
          });

          checkoutSessionUrl = checkoutSession.url;

          // Store checkout session ID for verification
          await db
            .update(bounty)
            .set({ stripeCheckoutSessionId: checkoutSession.id })
            .where(eq(bounty.id, newBounty.id));
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
            pay_later: payLater,
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
          checkoutUrl: checkoutSessionUrl,
          fees: fees / 100, // Convert back to dollars
          totalWithFees: totalWithFees / 100, // Convert back to dollars
          payLater,
          message: payLater
            ? 'Bounty created. Complete payment to make it live.'
            : 'Bounty created successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create bounty: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  fetchAllBounties: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties',
        summary: 'List all bounties',
        description: 'Returns a paginated list of bounties with optional filtering by status, tags, and search query. Requires authentication.',
        tags: ['Bounties'],
        protect: true,
      },
    })
    .input(getBountiesSchema)
    .output(bountyListOutputSchema)
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

        if (input.creatorId) {
          conditions.push(eq(bounty.createdById, input.creatorId));
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
            paymentStatus: bounty.paymentStatus,
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties/{id}',
        summary: 'Get bounty by ID',
        description: 'Returns the details of a specific bounty by its ID. Requires authentication.',
        tags: ['Bounties'],
        protect: true,
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(singleBountyOutputSchema)
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
            paymentStatus: bounty.paymentStatus,
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
            paymentStatus: bounty.paymentStatus,
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
            paymentStatus: bounty.paymentStatus,
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
            paymentStatus: bounty.paymentStatus,
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
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/bounties/{id}',
        summary: 'Update a bounty',
        description: 'Updates an existing bounty. Only the bounty creator can update it. Requires authentication.',
        tags: ['Bounties'],
        protect: true,
      },
    })
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
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/bounties/{id}',
        summary: 'Delete a bounty',
        description: 'Deletes a bounty. Only the bounty creator can delete it. Requires authentication.',
        tags: ['Bounties'],
        protect: true,
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(deleteBountyOutputSchema)
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

        // If payment was held, refund it
        if (
          existingBounty.stripePaymentIntentId &&
          existingBounty.paymentStatus === 'held'
        ) {
          try {
            await refundPayment(existingBounty.stripePaymentIntentId);

            // Update payment status
            await db
              .update(bounty)
              .set({
                paymentStatus: 'refunded',
                updatedAt: new Date(),
              })
              .where(eq(bounty.id, input.id));

            // Create transaction record
            await db.insert(transaction).values({
              bountyId: input.id,
              type: 'refund',
              amount: existingBounty.amount,
              stripeId: existingBounty.stripePaymentIntentId,
            });
          } catch (refundError) {
            // Log error but continue with deletion
            console.error('Failed to refund payment:', refundError);
          }
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties/{bountyId}/votes',
        summary: 'Get bounty votes',
        description: 'Returns the vote count for a bounty and whether the current user has voted',
        tags: ['Bounties'],
      },
    })
    .input(z.object({ bountyId: z.string().uuid() }))
    .output(bountyVotesOutputSchema)
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties/{id}/detail',
        summary: 'Get bounty detail',
        description: 'Returns complete bounty details including votes, bookmark status, and comments',
        tags: ['Bounties'],
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(bountyDetailOutputSchema)
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
            paymentStatus: bounty.paymentStatus,
            stripePaymentIntentId: bounty.stripePaymentIntentId,
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
            const notificationData: {
              bountyId: string;
              commentId: string;
              userId: string;
              userName?: string;
              userImage?: string;
            } = {
              bountyId: input.bountyId,
              commentId: inserted.id,
              userId: ctx.session.user.id,
              ...(ctx.session.user.name && { userName: ctx.session.user.name }),
              ...(ctx.session.user.image && { userImage: ctx.session.user.image }),
            };

            await createNotification({
              userId: owner.createdById,
              type: 'bounty_comment',
              title: `New comment on "${owner.title}"`,
              message:
                trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed,
              data: notificationData,
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/bounties/{bountyId}/comments',
        summary: 'Get bounty comments',
        description: 'Returns all comments for a bounty with like counts',
        tags: ['Comments'],
      },
    })
    .input(z.object({ bountyId: z.string().uuid() }))
    .output(z.array(commentSchema))
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

  confirmBountyPayment: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
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
            message: 'You can only confirm payment for your own bounties',
          });
        }

        if (!existingBounty.stripePaymentIntentId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No payment intent found for this bounty',
          });
        }

        // Capture the payment intent (this holds the funds)
        await capturePayment(existingBounty.stripePaymentIntentId);

        // Update bounty status
        await db
          .update(bounty)
          .set({
            paymentStatus: 'held',
            status: 'open',
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId));

        // Create transaction record
        await db.insert(transaction).values({
          bountyId: input.bountyId,
          type: 'payment_intent',
          amount: existingBounty.amount,
          stripeId: existingBounty.stripePaymentIntentId,
        });

        return {
          success: true,
          message: 'Payment confirmed and bounty is now live',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to confirm payment: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  approveBountySubmission: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid(), submissionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
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
            message: 'You can only approve submissions for your own bounties',
          });
        }

        if (existingBounty.paymentStatus !== 'held') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: existingBounty.paymentStatus === 'pending'
              ? 'This bounty requires payment before you can approve submissions. Please complete payment first.'
              : 'Payment must be held before approving submission',
          });
        }

        // Get the submission and solver
        const [submissionData] = await db
          .select()
          .from(submission)
          .where(eq(submission.id, input.submissionId))
          .limit(1);

        if (!submissionData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found',
          });
        }

        if (submissionData.bountyId !== input.bountyId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Submission does not belong to this bounty',
          });
        }

        // Get solver's Stripe Connect account
        const [solver] = await db
          .select({
            id: user.id,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
          })
          .from(user)
          .where(eq(user.id, submissionData.contributorId))
          .limit(1);

        if (!solver) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Solver not found',
          });
        }

        if (!solver.stripeConnectAccountId || !solver.stripeConnectOnboardingComplete) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Solver must have a connected Stripe account to receive payment',
          });
        }

        // Convert amount to cents for Stripe
        const amountInCents = Math.round(parseAmount(existingBounty.amount) * 100);

        // Create transfer to solver
        const transfer = await createTransfer({
          amount: amountInCents,
          connectAccountId: solver.stripeConnectAccountId,
          bountyId: input.bountyId,
        });

        // Update submission status
        await db
          .update(submission)
          .set({
            status: 'approved',
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(submission.id, input.submissionId));

        // Update bounty status
        await db
          .update(bounty)
          .set({
            status: 'completed',
            paymentStatus: 'released',
            stripeTransferId: transfer.id,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId));

        // Create payout record
        await db.insert(payout).values({
          userId: solver.id,
          bountyId: input.bountyId,
          amount: existingBounty.amount,
          status: 'processing',
          stripeTransferId: transfer.id,
        });

        // Create transaction record
        await db.insert(transaction).values({
          bountyId: input.bountyId,
          type: 'transfer',
          amount: existingBounty.amount,
          stripeId: transfer.id,
        });

        return {
          success: true,
          message: 'Submission approved and payment released',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to approve submission: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  getBountyPaymentStatus: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [bountyData] = await db
          .select({
            id: bounty.id,
            amount: bounty.amount,
            currency: bounty.currency,
            paymentStatus: bounty.paymentStatus,
            stripePaymentIntentId: bounty.stripePaymentIntentId,
            stripeTransferId: bounty.stripeTransferId,
            createdById: bounty.createdById,
          })
          .from(bounty)
          .where(eq(bounty.id, input.bountyId))
          .limit(1);

        if (!bountyData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        // Only creator can check payment status
        if (bountyData.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only check payment status for your own bounties',
          });
        }

        // Calculate fees
        const bountyAmountInCents = Math.round(parseAmount(bountyData.amount) * 100);
        const { fees, total: totalWithFees } = calculateTotalWithFees(bountyAmountInCents);

        return {
          success: true,
          data: {
            paymentStatus: bountyData.paymentStatus,
            stripePaymentIntentId: bountyData.stripePaymentIntentId,
            stripeTransferId: bountyData.stripeTransferId,
            fees: fees / 100,
            totalWithFees: totalWithFees / 100,
            bountyAmount: parseAmount(bountyData.amount),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get payment status: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  verifyCheckoutPayment: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Retrieve the checkout session from Stripe
        const session = await stripeClient.checkout.sessions.retrieve(input.sessionId);
        const bountyId = session.metadata?.bountyId;
        const paymentIntentId = session.payment_intent as string | null;

        if (!bountyId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No bounty ID found in checkout session',
          });
        }

        // Verify user owns this bounty
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, bountyId))
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
            message: 'You can only verify payment for your own bounties',
          });
        }

        // If payment intent exists, check its status
        if (paymentIntentId) {
          const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

          if (paymentIntent.status === 'succeeded') {
            // Idempotency check: Update bounty status if not already updated
            if (existingBounty.paymentStatus !== 'held') {
              await db
                .update(bounty)
                .set({
                  paymentStatus: 'held',
                  status: 'open',
                  stripePaymentIntentId: paymentIntentId,
                  stripeCheckoutSessionId: input.sessionId, // Store session ID
                  updatedAt: new Date(),
                })
                .where(eq(bounty.id, bountyId));

              // Create transaction record if it doesn't exist (idempotency)
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
              }
            } else {
              // Already processed, but ensure session ID is stored
              if (!existingBounty.stripeCheckoutSessionId) {
                await db
                  .update(bounty)
                  .set({ stripeCheckoutSessionId: input.sessionId })
                  .where(eq(bounty.id, bountyId));
              }
            }

            return {
              success: true,
              paymentStatus: 'held',
              message: 'Payment verified and bounty is now live',
            };
          }

          // Payment intent exists but hasn't succeeded yet
          return {
            success: false,
            paymentStatus: existingBounty.paymentStatus,
            stripeStatus: paymentIntent.status,
            message: `Payment not yet completed. Status: ${paymentIntent.status}`,
          };
        }

        return {
          success: false,
          paymentStatus: existingBounty.paymentStatus,
          message: 'Payment not yet completed',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify payment',
          cause: error,
        });
      }
    }),

  recheckPaymentStatus: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the bounty
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId))
          .limit(1);

        if (!existingBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        // Verify user owns this bounty
        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only recheck payment status for your own bounties',
          });
        }

        // If we have a payment intent ID, check its status directly
        if (existingBounty.stripePaymentIntentId) {
          const paymentIntent = await stripeClient.paymentIntents.retrieve(
            existingBounty.stripePaymentIntentId
          );

          if (paymentIntent.status === 'succeeded' && existingBounty.paymentStatus !== 'held') {
            // Payment succeeded but status wasn't updated - fix it
            await db
              .update(bounty)
              .set({
                paymentStatus: 'held',
                status: 'open',
                updatedAt: new Date(),
              })
              .where(eq(bounty.id, input.bountyId));

            // Create transaction record if it doesn't exist
            const [existingTransaction] = await db
              .select()
              .from(transaction)
              .where(eq(transaction.stripeId, existingBounty.stripePaymentIntentId))
              .limit(1);

            if (!existingTransaction) {
              await db.insert(transaction).values({
                bountyId: input.bountyId,
                type: 'payment_intent',
                amount: existingBounty.amount,
                stripeId: existingBounty.stripePaymentIntentId,
              });
            }

            return {
              success: true,
              paymentStatus: 'held',
              message: 'Payment verified! Bounty is now live.',
            };
          }

          return {
            success: true,
            paymentStatus: existingBounty.paymentStatus,
            stripeStatus: paymentIntent.status,
            message: `Payment Intent status: ${paymentIntent.status}, Bounty status: ${existingBounty.paymentStatus}`,
          };
        }

        // If no payment intent ID, search for payment intents directly by metadata
        // This is more reliable than searching checkout sessions
        const paymentIntents = await stripeClient.paymentIntents.list({
          limit: 100, // Check last 100 payment intents
        });

        // Find payment intents for this bounty (check metadata)
        const bountyPaymentIntents = paymentIntents.data.filter(
          (pi) => pi.metadata?.bountyId === input.bountyId
        );

        if (bountyPaymentIntents.length === 0) {
          // Fallback: search checkout sessions
          const sessions = await stripeClient.checkout.sessions.list({
            limit: 100,
          });

          const bountySessions = sessions.data.filter(
            (session) => session.metadata?.bountyId === input.bountyId
          );

          if (bountySessions.length === 0) {
            return {
              success: false,
              paymentStatus: existingBounty.paymentStatus,
              message: `No payment intents or checkout sessions found for this bounty. Current status: ${existingBounty.paymentStatus}`,
            };
          }

          // Get payment intent from session
          const latestSession = bountySessions.sort(
            (a, b) => (b.created ?? 0) - (a.created ?? 0)
          )[0];

          if (!latestSession) {
            return {
              success: false,
              paymentStatus: existingBounty.paymentStatus,
              message: `No checkout sessions found for this bounty. Current status: ${existingBounty.paymentStatus}`,
            };
          }

          const sessionPaymentIntentId = latestSession.payment_intent as string | null;

          if (!sessionPaymentIntentId) {
            return {
              success: false,
              paymentStatus: existingBounty.paymentStatus,
              message: `Checkout session found but no payment intent. Session status: ${latestSession.payment_status}`,
            };
          }

          const paymentIntent = await stripeClient.paymentIntents.retrieve(sessionPaymentIntentId);

          if (paymentIntent.status === 'succeeded' && existingBounty.paymentStatus !== 'held') {
            await db
              .update(bounty)
              .set({
                paymentStatus: 'held',
                status: 'open',
                stripePaymentIntentId: sessionPaymentIntentId,
                updatedAt: new Date(),
              })
              .where(eq(bounty.id, input.bountyId));

            const [existingTransaction] = await db
              .select()
              .from(transaction)
              .where(eq(transaction.stripeId, sessionPaymentIntentId))
              .limit(1);

            if (!existingTransaction) {
              await db.insert(transaction).values({
                bountyId: input.bountyId,
                type: 'payment_intent',
                amount: existingBounty.amount,
                stripeId: sessionPaymentIntentId,
              });
            }

            return {
              success: true,
              paymentStatus: 'held',
              message: 'Payment verified via checkout session! Bounty is now live.',
            };
          }

          return {
            success: true,
            paymentStatus: existingBounty.paymentStatus,
            stripeStatus: paymentIntent.status,
            sessionStatus: latestSession.payment_status,
            message: `Payment Intent status: ${paymentIntent.status}, Session status: ${latestSession.payment_status}, Bounty status: ${existingBounty.paymentStatus}`,
          };
        }

        // Use the most recent payment intent
        const latestPaymentIntent = bountyPaymentIntents.sort(
          (a, b) => (b.created ?? 0) - (a.created ?? 0)
        )[0];

        if (!latestPaymentIntent) {
          return {
            success: false,
            paymentStatus: existingBounty.paymentStatus,
            message: `No payment intents found for this bounty. Current status: ${existingBounty.paymentStatus}`,
          };
        }

        const paymentIntentId = latestPaymentIntent.id;

        if (latestPaymentIntent.status === 'succeeded' && existingBounty.paymentStatus !== 'held') {
          // Payment succeeded but status wasn't updated - fix it
          await db
            .update(bounty)
            .set({
              paymentStatus: 'held',
              status: 'open',
              stripePaymentIntentId: paymentIntentId,
              updatedAt: new Date(),
            })
            .where(eq(bounty.id, input.bountyId));

          // Create transaction record if it doesn't exist
          const [existingTransaction] = await db
            .select()
            .from(transaction)
            .where(eq(transaction.stripeId, paymentIntentId))
            .limit(1);

          if (!existingTransaction) {
            await db.insert(transaction).values({
              bountyId: input.bountyId,
              type: 'payment_intent',
              amount: existingBounty.amount,
              stripeId: paymentIntentId,
            });
          }

          return {
            success: true,
            paymentStatus: 'held',
            message: 'Payment verified! Bounty is now live.',
          };
        }

        return {
          success: true,
          paymentStatus: existingBounty.paymentStatus,
          stripeStatus: latestPaymentIntent.status,
          paymentIntentId: paymentIntentId,
          message: `Payment Intent status: ${latestPaymentIntent.status}, Bounty status: ${existingBounty.paymentStatus}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to recheck payment status: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  createPaymentForBounty: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
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
            message: 'You can only create payment for your own bounties',
          });
        }

        if (existingBounty.paymentStatus === 'held') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This bounty is already paid',
          });
        }

        // Ensure user has Stripe customer ID
        const userEmail = ctx.session.user.email;
        if (!userEmail) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User email is required',
          });
        }

        const stripeCustomerId = await ensureStripeCustomer(
          ctx.session.user.id,
          userEmail,
          ctx.session.user.name
        );

        // Calculate fees
        const bountyAmountInCents = Math.round(parseAmount(existingBounty.amount) * 100);
        const { fees } = calculateTotalWithFees(bountyAmountInCents);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const checkoutSession = await createBountyCheckoutSession({
          bountyId: input.bountyId,
          amount: bountyAmountInCents,
          fees,
          currency: existingBounty.currency,
          customerId: stripeCustomerId,
          successUrl: `${baseUrl}/bounty/${input.bountyId}`,
          cancelUrl: `${baseUrl}/bounty/${input.bountyId}?payment=cancelled`,
        });

        // Store checkout session ID for verification
        await db
          .update(bounty)
          .set({ stripeCheckoutSessionId: checkoutSession.id })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          data: {
            checkoutUrl: checkoutSession.url,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create payment: ${errorMessage}`,
          cause: error,
        });
      }
    }),
});
