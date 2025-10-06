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

const requireEmail = (email: string | null | undefined) => {
  if (typeof email === 'string' && email.trim().length > 0) {
    return email;
  }
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'User email is required to create a Polar customer',
  });
};

const deriveName = (
  userId: string,
  email: string | null | undefined,
  name: string | null | undefined
) => {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name;
  }
  if (typeof email === 'string' && email.trim().length > 0) {
    return email;
  }
  return userId;
};

const extractPolarMessage = (error: PolarError) =>
  String(error?.message || error?.body$ || error?.detail || '');

const isConflictError = (error: PolarError) => {
  const message = extractPolarMessage(error);
  return (
    error?.status === 409 ||
    message.includes('external ID cannot be updated') ||
    message.toLowerCase().includes('external_id cannot be updated') ||
    message.includes('"error":"PolarRequestValidationError"')
  );
};

const isNotFoundError = (error: PolarError) => {
  const message = extractPolarMessage(error).toLowerCase();
  return error?.status === 404 || message.includes('not found');
};

const ensurePolarCustomerExists = async (
  externalId: string,
  email: string,
  name: string
) => {
  const customerExists = await polarClient.customers
    .getExternal({ externalId })
    .then(() => true)
    .catch((fetchError: unknown) => {
      const error = fetchError as PolarError;
      if (isNotFoundError(error)) {
        return false;
      }
      if (isConflictError(error)) {
        return true;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to lookup Polar customer',
        cause: fetchError,
      });
    });

  if (customerExists) {
    return;
  }

  try {
    await polarClient.customers.create({
      externalId,
      email,
      name,
      metadata: { userId: externalId },
    });
  } catch (createError: unknown) {
    const error = createError as PolarError;
    if (isConflictError(error)) {
      return;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to ensure Polar customer',
      cause: createError,
    });
  }
};

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
    const email = requireEmail(user.email);
    const name = deriveName(externalId, user.email, user.name);

    await ensurePolarCustomerExists(externalId, email, name);
    return { ok: true } as const;
  }),
});
