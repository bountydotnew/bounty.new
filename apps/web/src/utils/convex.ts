/**
 * Convex client utilities.
 *
 * This file replaces utils/trpc.ts for the Convex migration.
 *
 * Key differences from tRPC:
 * - useQuery(api.functions.name, args) replaces trpc.router.name.queryOptions()
 * - useMutation(api.functions.name) replaces trpcClient.router.name.mutate()
 * - useAction(api.functions.name) for Convex actions (external API calls)
 * - No QueryClient needed — Convex handles caching and reactivity
 * - No RealtimeProvider needed — Convex queries are reactive by default
 */
import { api } from '../../../../convex/_generated/api';

// Re-export the api object for convenient imports
export { api };

// Re-export Convex React hooks that replace tRPC + React Query
export {
  useQuery,
  useMutation,
  useAction,
  usePaginatedQuery,
  useConvex,
} from 'convex/react';
