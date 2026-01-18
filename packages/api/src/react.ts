/**
 * tRPC React Utilities
 *
 * This file is meant to be re-exported by the consuming application
 * that sets up the actual tRPC client (e.g., apps/web/src/utils/trpc.ts)
 */

export type { AppRouter } from './routers';

// Re-export types that applications may need
export type { AppRouter as AppRouterType } from './routers';
