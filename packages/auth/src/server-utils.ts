import { headers } from 'next/headers';
import { cache } from 'react';
import { authClient } from './client';

/**
 * Server-side utility to get the current session
 * Uses React cache to deduplicate requests within the same render
 */
type GetSessionResult = Awaited<ReturnType<typeof authClient.getSession>>;

export const getServerSession = cache(async (): Promise<GetSessionResult> => {
  try {
    const headersList = await headers();
    const result = await authClient.getSession({
      fetchOptions: {
        headers: headersList,
      },
    });
    return result;
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Failed to get session'),
    } as GetSessionResult;
  }
});

/**
 * Server-side utility to get customer state from Polar
 * Uses React cache to deduplicate requests within the same render
 */
type GetCustomerStateResult = Awaited<
  ReturnType<typeof authClient.customer.state>
>;

export const getServerCustomerState = cache(
  async (): Promise<GetCustomerStateResult> => {
    try {
      const headersList = await headers();
      const result = await authClient.customer.state({
        fetchOptions: {
          headers: headersList,
        },
      });
      return result;
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to get customer state'),
      } as GetCustomerStateResult;
    }
  }
);
