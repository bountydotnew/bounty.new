import { env } from '@bounty/env/server';
import type { PolarError } from '@bounty/types';
import { Polar } from '@polar-sh/sdk';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';

const polarEnv = env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: polarEnv,
});

export const billingRouter = router({
  ensurePolarCustomer: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const externalId = user.id;

    try {
      await polarClient.customers.getExternal({ externalId });
      return { ok: true } as const;
    } catch (err: unknown) {
      const e = err as PolarError;
      if (e?.status && e.status !== 404) {
        // proceed to create anyway
      }
      try {
        await polarClient.customers.create({
          externalId: externalId,
          email: user.email ?? undefined,
          name: user.name ?? user.email ?? undefined,
          metadata: { userId: externalId },
        });
        return { ok: true } as const;
      } catch (createErr: unknown) {
        const error = createErr as PolarError;
        const msg = String(
          error?.message || error?.body$ || error?.detail || ''
        );
        if (
          error?.status === 409 ||
          msg.includes('external ID cannot be updated') ||
          msg.toLowerCase().includes('external_id cannot be updated') ||
          msg.includes('"error":"PolarRequestValidationError"')
        ) {
          return { ok: true } as const;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to ensure Polar customer',
          cause: createErr,
        });
      }
    }
  }),
});
