import type { ExtendedAuthSession } from '@bounty/types';
import { initTRPC, TRPCError } from '@trpc/server';
import type { ReasonCode } from '@bounty/types';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { Context } from './context';

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create({
  errorFormatter({ shape, error, path }) {
    const cause = error.cause as unknown;
    const reason = (typeof cause === 'object' && cause && 'reason' in (cause as Record<string, unknown>)
      ? (cause as { reason?: ReasonCode }).reason
      : undefined);

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
