import type { ExtendedAuthSession } from '@bounty/types';
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: 'No session',
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
    });
  }

  const user = await ctx.db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, ctx.session.user.id),
  });

  if (!user || user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
