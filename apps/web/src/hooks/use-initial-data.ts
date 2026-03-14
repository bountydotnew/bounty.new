import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { useSession } from '@/context/session-context';

/**
 * Hook to fetch essential data on initial app load
 *
 * Data fetched:
 * - User profile (getMe)
 *
 * @param enabled - Whether to fetch data (should be true when user is authenticated)
 */
export function useInitialData(enabled = true) {
  const { isAuthenticated } = useSession();
  const shouldFetch = enabled && isAuthenticated;

  // Fetch essential user data
  const me = useQuery(api.functions.user.getMe, shouldFetch ? {} : 'skip');

  return {
    me,
    isLoading: me === undefined && shouldFetch,
    isError: false,
    error: null,
  };
}
