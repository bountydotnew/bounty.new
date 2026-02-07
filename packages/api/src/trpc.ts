import type { ExtendedAuthSession } from '@bounty/types';
import { initTRPC, TRPCError } from '@trpc/server';
import type { ReasonCode } from '@bounty/types';
import type { Context } from './context';
import {
  checkRateLimit,
  createRateLimitKey,
  type RateLimitOperation,
} from './lib/ratelimiter';
import { member, organization } from '@bounty/db';
import { eq, and } from 'drizzle-orm';

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error, path }) {
    const cause = error.cause as unknown;
    const reason =
      typeof cause === 'object' &&
      cause &&
      'reason' in (cause as Record<string, unknown>)
        ? (cause as { reason?: ReasonCode }).reason
        : undefined;

    // Log errors to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('tRPC Error:', {
        code: error.code,
        message: error.message,
        path,
        reason,
      });
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        reason,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: { reason: 'unauthenticated' },
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const sessionData = ctx.session as ExtendedAuthSession;
  const impersonatedBy =
    sessionData?.impersonatedBy ?? sessionData?.session?.impersonatedBy;
  if (impersonatedBy) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Stop impersonating to view the admin panel',
      cause: { reason: 'forbidden' },
    });
  }

  const user = await ctx.db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, ctx.session.user.id),
  });

  if (!user || user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
      cause: { reason: 'forbidden' },
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const earlyAccessProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const userRole = ctx.session.user.role ?? 'user';
    if (!['early_access', 'admin'].includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Early access required',
        cause: { reason: 'early_access_required' },
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  }
);

// ============================================================================
// Organization-Scoped Procedures
// ============================================================================

/**
 * Procedure that requires an active organization.
 * Reads `session.activeOrganizationId`, validates membership via `member` table,
 * and provides `ctx.org` (the organization row) and `ctx.orgMembership` (the member row).
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const sessionData = ctx.session as ExtendedAuthSession;
  const activeOrgId = sessionData.session?.activeOrganizationId;

  if (!activeOrgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No active organization. Please select a team first.',
      cause: { reason: 'no_active_org' },
    });
  }

  // Validate membership in one query (join member + organization)
  const result = await ctx.db
    .select({
      org: organization,
      membership: member,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(
      and(
        eq(member.userId, ctx.session.user.id),
        eq(member.organizationId, activeOrgId)
      )
    )
    .limit(1);

  const row = result[0];
  if (!row) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this organization.',
      cause: { reason: 'forbidden' },
    });
  }

  return next({
    ctx: {
      ...ctx,
      org: row.org,
      orgMembership: row.membership,
    },
  });
});

/**
 * Procedure that requires the user to be an **owner** of the active organization.
 * Extends `orgProcedure` — provides `ctx.org` and `ctx.orgMembership`.
 */
export const orgOwnerProcedure = orgProcedure.use(async ({ ctx, next }) => {
  if (ctx.orgMembership.role !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only team owners can perform this action.',
      cause: { reason: 'forbidden' },
    });
  }

  return next({ ctx });
});

// ============================================================================
// Rate-Limited Procedures
// ============================================================================

/**
 * Rate-limited middleware factory for public procedures
 */
const createPublicRateLimitMiddleware = (operation: RateLimitOperation) => {
  return t.middleware(async ({ ctx, next }) => {
    const identifier = createRateLimitKey(ctx.session?.user?.id, ctx.clientIP);
    const result = await checkRateLimit(identifier, operation);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        cause: {
          reason: 'rate_limited',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: result.reset,
        },
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          limit: result.limit,
          reset: result.reset,
        },
      },
    });
  });
};

// Pre-built rate-limited procedures for common operations
export const rateLimitedPublicProcedure = (operation: RateLimitOperation) =>
  publicProcedure.use(createPublicRateLimitMiddleware(operation));

// Rate-limited protected procedure that preserves session type narrowing
export const rateLimitedProtectedProcedure = (operation: RateLimitOperation) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const identifier = createRateLimitKey(ctx.session.user.id, ctx.clientIP);
    const result = await checkRateLimit(identifier, operation);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        cause: {
          reason: 'rate_limited',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: result.reset,
        },
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          limit: result.limit,
          reset: result.reset,
        },
      },
    });
  });

// Rate-limited admin procedure
export const rateLimitedAdminProcedure = (operation: RateLimitOperation) =>
  adminProcedure.use(async ({ ctx, next }) => {
    const identifier = createRateLimitKey(ctx.session.user.id, ctx.clientIP);
    const result = await checkRateLimit(identifier, operation);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        cause: {
          reason: 'rate_limited',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: result.reset,
        },
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          limit: result.limit,
          reset: result.reset,
        },
      },
    });
  });

// Rate-limited org procedure
export const rateLimitedOrgProcedure = (operation: RateLimitOperation) =>
  orgProcedure.use(async ({ ctx, next }) => {
    const identifier = createRateLimitKey(ctx.session.user.id, ctx.clientIP);
    const result = await checkRateLimit(identifier, operation);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        cause: {
          reason: 'rate_limited',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: result.reset,
        },
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          limit: result.limit,
          reset: result.reset,
        },
      },
    });
  });
