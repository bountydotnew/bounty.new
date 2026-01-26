import type { ExtendedAuthSession } from '@bounty/types';
import { initTRPC, TRPCError } from '@trpc/server';
import type { ReasonCode } from '@bounty/types';
import type { Context } from './context';
import {
  checkRateLimit,
  createRateLimitKey,
  type RateLimitOperation,
} from './lib/ratelimiter';

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

export const earlyAccessProcedure = protectedProcedure.use(async ({ ctx, next }) => {
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
});

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
