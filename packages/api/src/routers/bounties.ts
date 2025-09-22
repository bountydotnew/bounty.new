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
import type Stripe from 'stripe';
import { z } from 'zod';
import {
  confirmBountyPayment,
  createBountyPaymentIntent,
  stripe,
} from '../lib/stripe';
import { getOrCreateCustomer } from '../lib/stripe-utils';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const parseAmount = (amount: string | number | null): number => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  const parsed = Number(amount);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildPaymentIntentParams = (
  input: z.infer<typeof createBountySchema>,
  sessionUser: { id: string; email?: string | null }
): Stripe.PaymentIntentCreateParams => {
  const normalizedAmount = Number.parseFloat(input.amount) * 100;

  return {
    amount: Math.round(normalizedAmount),
    currency: input.currency.toLowerCase(),
    payment_method: input.paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: {
      userId: sessionUser.id,
      bountyTitle: input.title,
    },
  };
};

const handlePaymentMethodCustomer = async (
  piCreate: Stripe.PaymentIntentCreateParams,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> => {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const paymentMethodCustomer = paymentMethod.customer as string;

  if (paymentMethodCustomer) {
    console.log("Using payment method's customer:", paymentMethodCustomer);
    piCreate.customer = paymentMethodCustomer;
    piCreate.setup_future_usage = 'off_session';

    return await stripe.paymentIntents.create(piCreate);
  }

  console.log('Payment method has no customer, trying without customer...');
  const retryParams: Stripe.PaymentIntentCreateParams = {
    amount: piCreate.amount,
    currency: piCreate.currency as string,
    payment_method: piCreate.payment_method as string,
    confirm: piCreate.confirm ?? false,
    ...(piCreate.automatic_payment_methods
      ? { automatic_payment_methods: piCreate.automatic_payment_methods }
      : {}),
    ...(piCreate.metadata ? { metadata: piCreate.metadata } : {}),
  };

  return await stripe.paymentIntents.create(retryParams);
};

const createPaymentIntentWithRetry = async (
  piCreate: Stripe.PaymentIntentCreateParams,
  input: z.infer<typeof createBountySchema>,
  savePaymentMethod: boolean
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create(piCreate);
    console.log(
      'PaymentIntent created:',
      paymentIntent.id,
      'Status:',
      paymentIntent.status
    );
    return paymentIntent;
  } catch (stripeError: unknown) {
    const err = stripeError as { code?: string; message?: string };
    console.error('Stripe PaymentIntent creation failed:', err);

    if (
      (err.code === 'payment_method_unusable' ||
        err.message?.includes('does not belong to the Customer')) &&
      savePaymentMethod
    ) {
      console.log(
        "Payment method not attachable to customer, trying with payment method's customer..."
      );
      return await handlePaymentMethodCustomer(piCreate, input.paymentMethodId);
    }

    throw stripeError;
  }
};

const createBountyInDatabase = async (
  input: z.infer<typeof createBountySchema>,
  userId: string
) => {
  const cleanedTags =
    Array.isArray(input.tags) && input.tags.length > 0 ? input.tags : undefined;
  const repositoryUrl =
    input.repositoryUrl && input.repositoryUrl.length > 0
      ? input.repositoryUrl
      : undefined;
  const issueUrl =
    input.issueUrl && input.issueUrl.length > 0 ? input.issueUrl : undefined;
  const deadline = input.deadline ? new Date(input.deadline) : undefined;

  const newBountyResult = await db
    .insert(bounty)
    .values({
      title: input.title,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      difficulty: input.difficulty,
      deadline,
      tags: cleanedTags ?? null,
      repositoryUrl,
      issueUrl,
      createdById: userId,
      status: 'draft',
      fundingStatus: 'unfunded',
    })
    .returning();

  const newBounty = newBountyResult[0];
  if (!newBounty) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create bounty',
    });
  }

  return newBounty;
};

const fetchBountyWithCreator = async (bountyId: string) => {
  const [bountyRow] = await db
    .select({
      id: bounty.id,
      title: bounty.title,
      description: bounty.description,
      amount: bounty.amount,
      currency: bounty.currency,
      status: bounty.status,
      fundingStatus: bounty.fundingStatus,
      difficulty: bounty.difficulty,
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
    .where(eq(bounty.id, bountyId));

  if (!bountyRow) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Bounty not found',
    });
  }

  return bountyRow;
};

const fetchBountyVoteCount = async (bountyId: string) => {
  const [voteCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bountyVote)
    .where(eq(bountyVote.bountyId, bountyId));

  return Number(voteCountRow?.count || 0);
};

const fetchUserVoteAndBookmark = async (bountyId: string, userId: string) => {
  const [existingVote] = await db
    .select({ id: bountyVote.id })
    .from(bountyVote)
    .where(
      and(eq(bountyVote.bountyId, bountyId), eq(bountyVote.userId, userId))
    );

  const [existingBookmark] = await db
    .select({ id: bountyBookmark.id })
    .from(bountyBookmark)
    .where(
      and(
        eq(bountyBookmark.bountyId, bountyId),
        eq(bountyBookmark.userId, userId)
      )
    );

  return {
    isVoted: Boolean(existingVote),
    bookmarked: Boolean(existingBookmark),
  };
};

const fetchBountyComments = async (bountyId: string) => {
  return await db
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
    .where(eq(bountyComment.bountyId, bountyId))
    .orderBy(desc(bountyComment.createdAt));
};

const fetchCommentLikes = async (commentIds: string[], userId?: string) => {
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
    userId && commentIds.length
      ? await db
          .select({ commentId: bountyCommentLike.commentId })
          .from(bountyCommentLike)
          .where(
            and(
              eq(bountyCommentLike.userId, userId),
              inArray(bountyCommentLike.commentId, commentIds)
            )
          )
      : [];

  return { likeCounts, userLikes };
};

const processCommentsWithLikes = (
  comments: Array<{
    id: string;
    content: string;
    originalContent: string | null;
    parentId: string | null;
    createdAt: Date;
    editCount: number;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
  }>,
  likeCounts: Array<{ commentId: string; likeCount: number }>,
  userLikes: Array<{ commentId: string }>
) => {
  return comments.map((c) => {
    const lc = likeCounts.find((x) => x.commentId === c.id);
    const isLiked = userLikes.some((x) => x.commentId === c.id);
    return {
      ...c,
      originalContent: c.originalContent ?? null,
      likeCount: lc?.likeCount || 0,
      isLiked,
    } as const;
  });
};

const validateCommentDuplication = async (
  bountyId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  if (parentId) {
    const [dupCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bountyComment)
      .where(
        and(
          eq(bountyComment.bountyId, bountyId),
          eq(bountyComment.userId, userId),
          isNotNull(bountyComment.parentId),
          eq(bountyComment.content, content)
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
          eq(bountyComment.bountyId, bountyId),
          eq(bountyComment.userId, userId),
          isNull(bountyComment.parentId),
          eq(bountyComment.content, content)
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
};

const createComment = async (
  bountyId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  const [inserted] = await db
    .insert(bountyComment)
    .values({
      bountyId,
      userId,
      content,
      parentId,
    })
    .returning();

  if (!inserted) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create comment',
    });
  }

  return inserted;
};

const trackCommentAdded = async (
  bountyId: string,
  commentId: string,
  userId: string,
  parentId?: string,
  contentLength?: number
) => {
  try {
    await track('bounty_comment_added', {
      bounty_id: bountyId,
      comment_id: commentId,
      user_id: userId,
      parent_id: parentId ?? undefined,
      content_length: contentLength ?? 0,
      source: 'api',
    });
  } catch {
    /* ignore */
  }
};

const notifyBountyOwner = async (
  bountyId: string,
  commentId: string,
  userId: string,
  content: string
) => {
  try {
    const [owner] = await db
      .select({ createdById: bounty.createdById, title: bounty.title })
      .from(bounty)
      .where(eq(bounty.id, bountyId))
      .limit(1);
    if (owner?.createdById && owner.createdById !== userId) {
      await createNotification({
        userId: owner.createdById,
        type: 'bounty_comment',
        title: `New comment on "${owner.title}"`,
        message: content.length > 100 ? `${content.slice(0, 100)}...` : content,
        data: { bountyId, commentId },
      });
    }
  } catch {
    /* ignore */
  }
};

const createBountySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.'),
  currency: z.string().default('USD'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional(),
  issueUrl: z.string().url().optional(),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  // If false, we will not attach the PM to the customer (one-time use)
  savePaymentMethod: z.boolean().optional(),
});

const createBountyDraftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, 'Incorrect amount.'),
  currency: z.string().default('USD'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  deadline: z.string().datetime().optional(),
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
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
    .optional(),
  deadline: z.string().datetime().optional(),
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
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
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

export const bountiesRouter = router({
  getBountyStats: publicProcedure.query(async () => {
    try {
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

      return {
        success: true,
        data: {
          totalBounties: totalBountiesResult[0]?.count ?? 0,
          activeBounties: activeBountiesResult[0]?.count ?? 0,
          totalBountiesValue: Number(totalBountiesValueResult[0]?.total) || 0,
          totalPayout: Number(totalPayoutResult[0]?.total) || 0,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch bounty statistics',
        cause: error,
      });
    }
  }),

  createBountyDraft: protectedProcedure
    .input(createBountyDraftSchema)
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
            difficulty: input.difficulty,
            deadline,
            tags: cleanedTags ?? null,
            repositoryUrl,
            issueUrl,
            createdById: ctx.session.user.id,
            status: 'draft',
            fundingStatus: 'unfunded',
          })
          .returning();

        const newBounty = newBountyResult[0];
        if (!newBounty) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create bounty draft',
          });
        }

        try {
          await track('bounty_draft_created', {
            bounty_id: newBounty.id,
            user_id: ctx.session.user.id,
            amount: parseAmount(normalizedAmount),
            currency: input.currency,
            difficulty: input.difficulty,
            has_repo: Boolean(repositoryUrl),
            has_issue: Boolean(issueUrl),
            tags_count: cleanedTags?.length ?? 0,
            source: 'api',
          });
        } catch (error) {
          console.error('Failed to track bounty draft created', error);
        }

        return {
          success: true,
          data: newBounty,
          message: 'Bounty draft created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bounty draft',
          cause: error,
        });
      }
    }),

  fundBounty: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
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

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only fund your own bounties',
          });
        }

        if (existingBounty.fundingStatus === 'funded') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bounty is already funded',
          });
        }

        const amount = parseAmount(existingBounty.amount);
        const paymentIntent = await createBountyPaymentIntent({
          amount,
          currency: existingBounty.currency,
          bountyId: input.bountyId,
          userId: ctx.session.user.id,
        });

        await db
          .update(bounty)
          .set({
            stripePaymentIntentId: paymentIntent.paymentIntentId,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          data: {
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
          },
          message: 'Payment intent created',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to setup bounty funding',
          cause: error,
        });
      }
    }),

  confirmBountyFunding: protectedProcedure
    .input(
      z.object({
        bountyId: z.string().uuid(),
        paymentIntentId: z.string(),
      })
    )
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

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only confirm funding for your own bounties',
          });
        }

        const paymentResult = await confirmBountyPayment(input.paymentIntentId);

        if (paymentResult.success) {
          await db
            .update(bounty)
            .set({
              fundingStatus: 'funded',
              status: 'open',
              updatedAt: new Date(),
            })
            .where(eq(bounty.id, input.bountyId));

          try {
            await track('bounty_funded', {
              bounty_id: input.bountyId,
              user_id: ctx.session.user.id,
              amount: paymentResult.amount,
              currency: paymentResult.currency,
              payment_intent_id: input.paymentIntentId,
              source: 'api',
            });
          } catch (error) {
            console.error('Failed to track bounty funded', error);
          }

          return {
            success: true,
            data: { status: 'funded' },
            message: 'Bounty funded and published successfully',
          };
        }
        return {
          success: false,
          data: { status: paymentResult.status },
          message: 'Payment not yet completed',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm bounty funding',
          cause: error,
        });
      }
    }),

  publishBounty: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
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

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only publish your own bounties',
          });
        }

        if (existingBounty.status !== 'draft') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only draft bounties can be published',
          });
        }

        // Determine the new status based on funding
        const newStatus =
          existingBounty.fundingStatus === 'funded' ? 'open' : 'draft';

        const updatedBountyResult = await db
          .update(bounty)
          .set({
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, input.bountyId))
          .returning();

        const updatedBounty = updatedBountyResult[0];
        if (!updatedBounty) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to publish bounty',
          });
        }

        try {
          await track('bounty_published', {
            bounty_id: input.bountyId,
            user_id: ctx.session.user.id,
            funding_status: existingBounty.fundingStatus,
            source: 'api',
          });
        } catch (error) {
          console.error('Failed to track bounty published', error);
        }

        return {
          success: true,
          data: updatedBounty,
          message: 'Bounty published successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish bounty',
          cause: error,
        });
      }
    }),

  createBounty: protectedProcedure
    .input(createBountySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionUser = ctx.session.user;
        const savePaymentMethod = input.savePaymentMethod ?? true;

        console.log('Creating bounty with params:', {
          userId: sessionUser.id,
          paymentMethodId: input.paymentMethodId,
          savePaymentMethod,
          amount: input.amount,
          currency: input.currency,
        });

        const piCreate = buildPaymentIntentParams(input, sessionUser);

        if (savePaymentMethod) {
          console.log('Getting or creating customer for user:', sessionUser.id);
          const customerId = await getOrCreateCustomer(
            sessionUser.id,
            sessionUser.email || ''
          );
          piCreate.customer = customerId;
          piCreate.setup_future_usage = 'off_session';
          console.log('Customer ID:', customerId);
        }

        console.log('Creating PaymentIntent with params:', piCreate);
        const paymentIntent = await createPaymentIntentWithRetry(
          piCreate,
          input,
          savePaymentMethod
        );

        if (paymentIntent.status !== 'succeeded') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Payment confirmation failed',
          });
        }

        const newBounty = await createBountyInDatabase(
          input,
          ctx.session.user.id
        );

        try {
          await track('bounty_created', {
            bounty_id: newBounty.id,
            user_id: ctx.session.user.id,
            amount: parseAmount(input.amount),
            currency: input.currency,
            difficulty: input.difficulty,
            has_repo: Boolean(input.repositoryUrl),
            has_issue: Boolean(input.issueUrl),
            tags_count: input.tags?.length ?? 0,
            source: 'api',
          });
        } catch {
          /* ignore */
        }

        return {
          success: true,
          data: newBounty,
          message: 'Bounty created successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bounty',
          cause: error,
        });
      }
    }),

  fetchAllBounties: publicProcedure
    .input(getBountiesSchema)
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        /* biome-ignore lint/suspicious/noExplicitAny: Drizzle SQL expression typing is complex here */
        const conditions: any[] = [];

        // Only show funded bounties in public listing (exclude unfunded drafts)
        conditions.push(eq(bounty.fundingStatus, 'funded'));

        // Only show open bounties in public listing unless user explicitly searches for other statuses
        if (input.status) {
          conditions.push(eq(bounty.status, input.status));
        } else {
          conditions.push(eq(bounty.status, 'open'));
        }

        if (input.difficulty) {
          conditions.push(eq(bounty.difficulty, input.difficulty));
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
            difficulty: bounty.difficulty,
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

  fetchBountyById: publicProcedure
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
            difficulty: bounty.difficulty,
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

  getBountiesByUserId: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const results = await db
          .select()
          .from(bounty)
          .where(eq(bounty.createdById, input.userId));
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bounties',
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
            difficulty: input.difficulty,
            has_repo: Boolean(updatedBounty.repositoryUrl),
            has_issue: Boolean(updatedBounty.issueUrl),
            tags_count: updatedBounty.tags?.length ?? 0,
            source: 'api',
          });
        } catch {
          /* ignore */
        }

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
        } catch {
          /* ignore */
        }

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
        } catch {
          /* ignore */
        }

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
        const bountyRow = await fetchBountyWithCreator(input.id);
        const voteCount = await fetchBountyVoteCount(input.id);

        let isVoted = false;
        let bookmarked = false;
        if (ctx.session?.user?.id) {
          const userData = await fetchUserVoteAndBookmark(
            input.id,
            ctx.session.user.id
          );
          isVoted = userData.isVoted;
          bookmarked = userData.bookmarked;
        }

        const comments = await fetchBountyComments(input.id);
        const commentIds = comments.map((c) => c.id);
        const { likeCounts, userLikes } = await fetchCommentLikes(
          commentIds,
          ctx.session?.user?.id
        );

        const commentsWithLikes = processCommentsWithLikes(
          comments,
          likeCounts,
          userLikes
        );

        return {
          bounty: { ...bountyRow, amount: parseAmount(bountyRow.amount) },
          votes: { count: voteCount, isVoted },
          bookmarked,
          comments: commentsWithLikes,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
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
          } catch {
            /* ignore */
          }
          return { bookmarked: false };
        }
        try {
          await track('bounty_bookmark_toggled', {
            bounty_id: input.bountyId,
            user_id: ctx.session.user.id,
            bookmarked: true,
            source: 'api',
          });
        } catch {
          /* ignore */
        }
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
            difficulty: bounty.difficulty,
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
        await validateCommentDuplication(
          input.bountyId,
          ctx.session.user.id,
          trimmed,
          input.parentId
        );

        const inserted = await createComment(
          input.bountyId,
          ctx.session.user.id,
          trimmed,
          input.parentId
        );
        await trackCommentAdded(
          input.bountyId,
          inserted.id,
          ctx.session.user.id,
          input.parentId,
          trimmed.length
        );
        await notifyBountyOwner(
          input.bountyId,
          inserted.id,
          ctx.session.user.id,
          trimmed
        );

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
        } catch {
          /* ignore */
        }
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
        } catch {
          /* ignore */
        }
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
        } catch {
          /* ignore */
        }
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
            difficulty: bounty.difficulty,
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

  createPaymentLink: protectedProcedure
    .input(z.object({ bountyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const bountyResult = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId))
          .limit(1);

        const targetBounty = bountyResult[0];
        if (!targetBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        // Here you would integrate with Polar or Stripe to create a payment link
        // For now, creating a mock payment URL
        const paymentUrl = `https://checkout.polar.sh/pay?bounty_id=${input.bountyId}&amount=${targetBounty.amount}&currency=${targetBounty.currency}`;

        return {
          success: true,
          paymentUrl,
          bountyId: input.bountyId,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment link',
          cause: error,
        });
      }
    }),

  processManualPayment: protectedProcedure
    .input(
      z.object({
        bountyId: z.string().uuid(),
        cardDetails: z.object({
          cardNumber: z.string().min(16),
          expiryDate: z.string().min(5),
          cvv: z.string().min(3),
          cardholderName: z.string().min(2),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const bountyResult = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId))
          .limit(1);

        const targetBounty = bountyResult[0];
        if (!targetBounty) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Bounty not found',
          });
        }

        // Here you would integrate with Polar or Stripe to process the card payment
        // For now, we'll simulate a successful payment

        // In a real implementation, you would:
        // 1. Create a payment intent with Polar/Stripe
        // 2. Process the payment with the card details
        // 3. Update the bounty status if needed
        // 4. Create payment records in the database

        // Mock payment processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        return {
          success: true,
          paymentId: `pay_${Date.now()}`,
          bountyId: input.bountyId,
          amount: parseAmount(targetBounty.amount),
          currency: targetBounty.currency,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process payment',
          cause: error,
        });
      }
    }),
});
