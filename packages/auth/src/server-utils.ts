import { headers } from 'next/headers';
import { cache } from 'react';
import type { Session } from 'better-auth/types';
import { authClient } from './client';

/**
 * Server-side utility to get the current session
 * Uses React cache to deduplicate requests within the same render
 */
export const getServerSession = cache(async (): Promise<{
  data: Session | null;
  error: Error | null;
}> => {
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
      error: error instanceof Error ? error : new Error('Failed to get session'),
    };
  }
});

/**
 * Server-side utility to get customer state from Polar
 * Uses React cache to deduplicate requests within the same render
 */
export const getServerCustomerState = cache(async () => {
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
      error: error instanceof Error ? error : new Error('Failed to get customer state'),
    };
  }
});
